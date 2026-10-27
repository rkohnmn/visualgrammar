/**
 * VisualGrammar — Data Understanding, Type Inference, & Transformation Engine (data-engine.js)
 * Conforms to DATA_CONVENTIONS.md v1.0.0 and Part 6 of the VisualGrammar specification.
 */

import { computeUnivariateStats, EPSILON } from './math-engine.js';

/**
 * 19-Category Statistical & Semantic Variable Taxonomy (Part 6.3)
 */
export const VARIABLE_TAXONOMY = {
  nominal_categorical: {
    id: 'nominal_categorical',
    label: 'Nominal Categorical',
    shortLabel: 'Nominal',
    family: 'categorical',
    physicalStorage: 'string',
    description: 'Unordered qualitative categories without intrinsic numerical ranking.',
    allowedOperations: ['count', 'proportion', 'mode', 'group'],
    prohibitedOperations: ['mean', 'sd', 'linear_interpolation']
  },
  ordinal_categorical: {
    id: 'ordinal_categorical',
    label: 'Ordinal Categorical',
    shortLabel: 'Ordinal',
    family: 'categorical',
    physicalStorage: 'ordered_factor',
    description: 'Qualitative categories with a meaningful natural rank order, but unequal numeric intervals.',
    allowedOperations: ['count', 'proportion', 'median_rank', 'ordered_comparison'],
    prohibitedOperations: ['mean', 'sd', 'alphabetical_reordering']
  },
  binary_categorical: {
    id: 'binary_categorical',
    label: 'Binary Categorical',
    shortLabel: 'Binary',
    family: 'categorical',
    physicalStorage: 'boolean_or_int',
    description: 'Dichotomous variable taking exactly two mutually exclusive states (e.g., 0/1, Yes/No, Control/Treatment).',
    allowedOperations: ['count', 'proportion', 'rate', 'group'],
    prohibitedOperations: ['continuous_density', 'polynomial_fit']
  },
  discrete_quantitative: {
    id: 'discrete_quantitative',
    label: 'Discrete Quantitative',
    shortLabel: 'Discrete Num',
    family: 'quantitative',
    physicalStorage: 'int64',
    description: 'Numerical variable taking isolated integer values with meaningful arithmetic differences.',
    allowedOperations: ['mean', 'median', 'sd', 'iqr', 'sum', 'histogram'],
    prohibitedOperations: ['fractional_binning_artifacts']
  },
  continuous_quantitative: {
    id: 'continuous_quantitative',
    label: 'Continuous Quantitative',
    shortLabel: 'Continuous',
    family: 'quantitative',
    physicalStorage: 'float64',
    description: 'Real-valued numerical measurement on a continuous interval scale.',
    allowedOperations: ['mean', 'median', 'sd', 'iqr', 'kde', 'ecdf', 'ols'],
    prohibitedOperations: ['raw_equality_mode']
  },
  count: {
    id: 'count',
    label: 'Count (Non-Negative Integer)',
    shortLabel: 'Count',
    family: 'quantitative',
    physicalStorage: 'int64',
    description: 'Non-negative integer tally of events or items (bounded below by zero).',
    allowedOperations: ['sum', 'mean', 'median', 'proportion', 'bar_length'],
    prohibitedOperations: ['negative_extrapolation']
  },
  proportion: {
    id: 'proportion',
    label: 'Proportion [0, 1]',
    shortLabel: 'Proportion',
    family: 'quantitative',
    physicalStorage: 'float64',
    description: 'Normalized share or probability bounded strictly within [0.0, 1.0].',
    allowedOperations: ['mean', 'median', 'part_to_whole', 'logit'],
    prohibitedOperations: ['unweighted_sum_across_different_denominators']
  },
  rate: {
    id: 'rate',
    label: 'Rate / Percentage',
    shortLabel: 'Rate / %',
    family: 'quantitative',
    physicalStorage: 'float64',
    description: 'Ratio of events per unit of exposure or percentage scaled [0, 100].',
    allowedOperations: ['mean', 'median', 'comparison', 'choropleth'],
    prohibitedOperations: ['raw_sum_without_exposure_weights']
  },
  date: {
    id: 'date',
    label: 'Calendar Date',
    shortLabel: 'Date',
    family: 'temporal',
    physicalStorage: 'iso_date',
    description: 'Calendar date coordinate (YYYY-MM-DD or YYYY-MM) ordering observations chronologically.',
    allowedOperations: ['chronological_sort', 'time_series', 'date_extract'],
    prohibitedOperations: ['unordered_bar_shuffling']
  },
  datetime: {
    id: 'datetime',
    label: 'Timestamp (Datetime)',
    shortLabel: 'Datetime',
    family: 'temporal',
    physicalStorage: 'iso_datetime',
    description: 'High-resolution timestamp with date and clock time.',
    allowedOperations: ['chronological_sort', 'time_series', 'duration_diff'],
    prohibitedOperations: ['categorical_pie_encoding']
  },
  duration: {
    id: 'duration',
    label: 'Duration / Elapsed Time',
    shortLabel: 'Duration',
    family: 'quantitative',
    physicalStorage: 'float64',
    description: 'Non-negative elapsed time interval with a true zero origin.',
    allowedOperations: ['mean', 'median', 'iqr', 'ecdf', 'log_transform'],
    prohibitedOperations: []
  },
  cyclic_temporal: {
    id: 'cyclic_temporal',
    label: 'Cyclic Temporal Category',
    shortLabel: 'Cyclic Time',
    family: 'temporal',
    physicalStorage: 'ordered_factor',
    description: 'Repeating periodic time unit such as month of year, day of week, or hour of day.',
    allowedOperations: ['seasonal_plot', 'polar_plot', 'ordered_comparison'],
    prohibitedOperations: ['alphabetical_sorting']
  },
  geographic_coordinate: {
    id: 'geographic_coordinate',
    label: 'Geographic Coordinate (Lat/Lon)',
    shortLabel: 'Geo Coord',
    family: 'spatial',
    physicalStorage: 'float64',
    description: 'Spatial latitude or longitude coordinate in decimal degrees.',
    allowedOperations: ['spatial_projection', 'point_map'],
    prohibitedOperations: ['bar_chart_aggregation', 'pie_chart']
  },
  geographic_region: {
    id: 'geographic_region',
    label: 'Geographic Region Identifier',
    shortLabel: 'Geo Region',
    family: 'spatial',
    physicalStorage: 'string',
    description: 'Named state, country, postal/ZIP code, or administrative region.',
    allowedOperations: ['choropleth', 'grouped_comparison'],
    prohibitedOperations: ['continuous_arithmetic_on_zip_codes']
  },
  identifier: {
    id: 'identifier',
    label: 'General Identifier / Key',
    shortLabel: 'Identifier',
    family: 'metadata',
    physicalStorage: 'string_or_int',
    description: 'Unique observation key, serial number, or record ID used to label units rather than measure magnitude.',
    allowedOperations: ['label', 'lookup', 'join'],
    prohibitedOperations: ['mean', 'sd', 'regression_predictor', 'histogram']
  },
  text: {
    id: 'text',
    label: 'Free Text / Annotation',
    shortLabel: 'Text',
    family: 'metadata',
    physicalStorage: 'string',
    description: 'Unstructured descriptive text, notes, or high-cardinality comments.',
    allowedOperations: ['tooltip_annotation', 'search', 'word_frequency'],
    prohibitedOperations: ['axis_mapping']
  },
  grouping_variable: {
    id: 'grouping_variable',
    label: 'Grouping / Stratum Factor',
    shortLabel: 'Group Factor',
    family: 'categorical',
    physicalStorage: 'string',
    description: 'Experimental treatment arm, cohort, or stratification variable used to partition observations.',
    allowedOperations: ['color_hue', 'facet', 'grouped_distribution', 'anova'],
    prohibitedOperations: ['continuous_regression_slope']
  },
  derived_statistic: {
    id: 'derived_statistic',
    label: 'Derived Statistic / Interval Bound',
    shortLabel: 'Derived Stat',
    family: 'uncertainty',
    physicalStorage: 'float64',
    description: 'Pre-computed parameter estimate, standard error, or confidence/prediction interval bound.',
    allowedOperations: ['interval_plot', 'error_bar', 'ribbon'],
    prohibitedOperations: ['treating_se_as_raw_observation']
  },
  unknown: {
    id: 'unknown',
    label: 'Unknown or Ambiguous',
    shortLabel: 'Ambiguous',
    family: 'metadata',
    physicalStorage: 'mixed',
    description: 'Column with all missing values or conflicting formats requiring manual disambiguation.',
    allowedOperations: ['inspect'],
    prohibitedOperations: ['automated_modeling']
  }
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'q1', 'q2', 'q3', 'q4'];
const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ORDINAL_LEXICONS = [
  ['none', 'mild', 'moderate', 'severe', 'extreme'],
  ['very low', 'low', 'medium', 'high', 'very high'],
  ['low', 'medium', 'high'],
  ['small', 'medium', 'large'],
  ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'],
  ['tier 1', 'tier 2', 'tier 3', 'tier 4'],
  ['stage i', 'stage ii', 'stage iii', 'stage iv'],
  ['p1', 'p2', 'p3', 'p4']
];

/**
 * RFC 4180 Compliant Delimited Text Parser (CSV / TSV / Semicolon)
 * Conforms strictly to DATA_CONVENTIONS.md Section D.1
 */
export function parseDelimitedText(rawText, options = {}) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return {
      valid: false,
      headers: [],
      rows: [],
      errors: ['Input text is empty.']
    };
  }

  const cleanText = rawText.replace(/^\uFEFF/, '').trim();

  let delimiter = options.delimiter || null;
  if (!delimiter) {
    const firstLineEnd = cleanText.indexOf('\n');
    const firstLine = firstLineEnd >= 0 ? cleanText.slice(0, firstLineEnd) : cleanText;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    if (tabCount > commaCount && tabCount >= semiCount) delimiter = '\t';
    else if (semiCount > commaCount) delimiter = ';';
    else delimiter = ',';
  }

  const records = [];
  let currentRecord = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = cleanText.length;

  while (i < len) {
    const ch = cleanText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && cleanText[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += ch;
        i++;
        continue;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === delimiter) {
        currentRecord.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }
      if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && i + 1 < len && cleanText[i + 1] === '\n') {
          i++;
        }
        currentRecord.push(currentField.trim());
        if (currentRecord.some(cell => cell !== '')) {
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      }
      currentField += ch;
      i++;
    }
  }
  currentRecord.push(currentField.trim());
  if (currentRecord.some(cell => cell !== '')) {
    records.push(currentRecord);
  }

  if (records.length < 2) {
    return {
      valid: false,
      headers: records[0] || [],
      rows: [],
      errors: ['Dataset must contain a header row and at least one observation row.']
    };
  }

  const rawHeaders = records[0];
  const headers = rawHeaders.map((h, idx) => {
    const cleaned = (h || `var_${idx + 1}`).trim();
    return cleaned || `var_${idx + 1}`;
  });

  const rows = [];
  const errors = [];

  for (let rIdx = 1; rIdx < records.length; rIdx++) {
    const rawRow = records[rIdx];
    if (rawRow.length !== headers.length) {
      errors.push(`Line ${rIdx + 1}: Expected ${headers.length} columns, found ${rawRow.length}.`);
    }
    const rowObj = { obs_id: `row_${rIdx}` };
    for (let cIdx = 0; cIdx < headers.length; cIdx++) {
      const colName = headers[cIdx];
      const cellStr = rawRow[cIdx] !== undefined ? rawRow[cIdx] : '';
      if (cellStr === '' || cellStr.toLowerCase() === 'na' || cellStr.toLowerCase() === 'null' || cellStr.toLowerCase() === 'nan') {
        rowObj[colName] = null;
      } else {
        const numVal = Number(cellStr);
        const hasLeadingZero = /^0\d+$/.test(cellStr);
        if (!hasLeadingZero && cellStr !== '' && Number.isFinite(numVal)) {
          rowObj[colName] = numVal;
        } else {
          rowObj[colName] = cellStr;
        }
      }
    }
    rows.push(rowObj);
  }

  return {
    valid: rows.length > 0,
    delimiter,
    headers,
    rows,
    errors
  };
}

/**
 * Transparent Variable-Type Inference Engine (Part 6.4)
 */
export function inferVariableType(colName, values, totalRows, userMetadata = {}) {
  if (userMetadata && userMetadata.overrideType && VARIABLE_TAXONOMY[userMetadata.overrideType]) {
    const tax = VARIABLE_TAXONOMY[userMetadata.overrideType];
    return {
      inferredType: userMetadata.overrideType,
      physicalType: tax.physicalStorage,
      confidence: 'User Override',
      isAmbiguous: false,
      reasoning: `Manually assigned as ${tax.label} by user override.`,
      alternatives: Object.keys(VARIABLE_TAXONOMY).filter(k => k !== userMetadata.overrideType).slice(0, 4),
      orderedLevels: userMetadata.orderedLevels || null
    };
  }

  const nameLower = String(colName).toLowerCase();
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  const nValid = nonNull.length;

  if (nValid === 0) {
    return {
      inferredType: 'unknown',
      physicalType: 'null',
      confidence: 'Low',
      isAmbiguous: true,
      reasoning: 'All observations in this column are missing (null).',
      alternatives: ['nominal_categorical', 'continuous_quantitative']
    };
  }

  const uniqueVals = Array.from(new Set(nonNull.map(v => String(v).trim())));
  const nUnique = uniqueVals.length;
  const uniqueRatio = nUnique / nValid;

  const numericVals = [];
  let allNumeric = true;
  let allIntegers = true;
  for (let i = 0; i < nValid; i++) {
    const v = nonNull[i];
    const num = typeof v === 'number' ? v : Number(String(v).replace(/,/g, ''));
    if (Number.isFinite(num) && String(v).trim() !== '') {
      numericVals.push(num);
      if (!Number.isInteger(num)) allIntegers = false;
    } else {
      allNumeric = false;
      allIntegers = false;
      break;
    }
  }

  // 1. Check Explicit Identifier Patterns
  if (nameLower === 'obs_id' || /(^|_)(id|uuid|serial|code|ssn)($|_)/.test(nameLower)) {
    if (/(zip|postal|fips)/.test(nameLower)) {
      return {
        inferredType: 'geographic_region',
        physicalType: allIntegers ? 'int64' : 'string',
        confidence: 'High',
        isAmbiguous: true,
        reasoning: `Numeric/alphanumeric postal or region code ("${colName}"). Stored with digits, but arithmetic means on ZIP codes are meaningless.`,
        alternatives: ['identifier', 'nominal_categorical']
      };
    }
    if (/(priority|tier|rank|stage|grade)/.test(nameLower) && nUnique <= 10) {
      return {
        inferredType: 'ordinal_categorical',
        physicalType: allIntegers ? 'int64' : 'ordered_factor',
        confidence: 'Moderate',
        isAmbiguous: true,
        reasoning: `Small set of ordered code values (${nUnique} distinct levels) representing rank or priority.`,
        alternatives: ['nominal_categorical', 'discrete_quantitative'],
        orderedLevels: [...uniqueVals].sort((a, b) => Number(a) - Number(b))
      };
    }
    if (uniqueRatio > 0.85 || /(^|_)(id|serial)($|_)/.test(nameLower)) {
      return {
        inferredType: 'identifier',
        physicalType: allIntegers ? 'int64' : 'string',
        confidence: 'High',
        isAmbiguous: allNumeric,
        reasoning: `High uniqueness (${nUnique}/${nValid} distinct) and identifier naming pattern ("${colName}"). Should not be treated as a continuous measurement.`,
        alternatives: ['nominal_categorical', 'discrete_quantitative']
      };
    }
  }

  // 2. Check ZIP / Postal code
  if (/(^|_)(zip|postal|fips|state_code|region_code|country)($|_)/.test(nameLower)) {
    return {
      inferredType: 'geographic_region',
      physicalType: allIntegers ? 'int64' : 'string',
      confidence: 'High',
      isAmbiguous: allNumeric,
      reasoning: `Geographic region or postal identifier ("${colName}").`,
      alternatives: ['nominal_categorical', 'identifier']
    };
  }

  // 3. Check Geographic Coordinates (Latitude / Longitude)
  if (allNumeric && /(^|_)(lat|latitude|lon|lng|longitude)($|_)/.test(nameLower)) {
    const minV = Math.min(...numericVals);
    const maxV = Math.max(...numericVals);
    if (minV >= -180 && maxV <= 180) {
      return {
        inferredType: 'geographic_coordinate',
        physicalType: 'float64',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `Decimal degree spatial coordinate within valid [-180, 180] bounds.`,
        alternatives: ['continuous_quantitative']
      };
    }
  }

  // 4. Check Derived Statistics / Uncertainty Bounds
  if (allNumeric && /(^|_)(ci_low|ci_high|ci95_low|ci95_high|pred95_low|pred95_high|se|std_err|point_estimate|lower_bound|upper_bound)($|_)/.test(nameLower)) {
    return {
      inferredType: 'derived_statistic',
      physicalType: 'float64',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Pre-computed statistical estimate, standard error, or confidence/prediction interval bound ("${colName}").`,
      alternatives: ['continuous_quantitative']
    };
  }

  // 5. Check Binary / Dichotomous Variables
  if (nUnique === 2) {
    const isZeroOne = allIntegers && numericVals.every(v => v === 0 || v === 1);
    if (isZeroOne || !allNumeric) {
      return {
        inferredType: 'binary_categorical',
        physicalType: isZeroOne ? 'int64' : 'string',
        confidence: isZeroOne ? 'Moderate' : 'High',
        isAmbiguous: isZeroOne,
        reasoning: isZeroOne
          ? `Numeric 0/1 indicator column with exactly 2 states. Classified as Binary Categorical rather than continuous measurement.`
          : `Dichotomous categorical variable with 2 states (${uniqueVals.join(' / ')}).`,
        alternatives: isZeroOne ? ['discrete_quantitative', 'proportion', 'nominal_categorical'] : ['nominal_categorical', 'grouping_variable'],
        orderedLevels: uniqueVals
      };
    }
  }

  // 6. Check Temporal & Cyclic Temporal Variables
  if (!allNumeric) {
    const lowerUnique = uniqueVals.map(u => u.toLowerCase());
    if (lowerUnique.every(u => MONTH_NAMES.includes(u) || DAY_NAMES.includes(u))) {
      return {
        inferredType: 'cyclic_temporal',
        physicalType: 'ordered_factor',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `Periodic calendar cycle names (${uniqueVals.slice(0, 4).join(', ')}...). Ordered chronologically rather than alphabetically.`,
        alternatives: ['ordinal_categorical', 'date'],
        orderedLevels: uniqueVals
      };
    }

    const dateRegex = /^\d{4}[-/](\d{1,2}|Q[1-4])([-/]\d{1,2})?$/i;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/;
    const dateMatches = uniqueVals.filter(u => dateRegex.test(u) || datetimeRegex.test(u)).length;
    if (dateMatches / nUnique >= 0.85) {
      const isDateTime = uniqueVals.some(u => datetimeRegex.test(u));
      return {
        inferredType: isDateTime ? 'datetime' : 'date',
        physicalType: isDateTime ? 'iso_datetime' : 'iso_date',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `${isDateTime ? 'ISO timestamp' : 'Calendar date'} pattern detected across ${Math.round((dateMatches / nUnique) * 100)}% of distinct values.`,
        alternatives: ['ordinal_categorical', 'nominal_categorical']
      };
    }

    for (const lexicon of ORDINAL_LEXICONS) {
      if (lowerUnique.every(u => lexicon.includes(u))) {
        const ordered = lexicon.filter(l => lowerUnique.includes(l)).map(l => {
          return uniqueVals.find(orig => orig.toLowerCase() === l) || l;
        });
        return {
          inferredType: 'ordinal_categorical',
          physicalType: 'ordered_factor',
          confidence: 'High',
          isAmbiguous: false,
          reasoning: `Matches ordered scale (${ordered.join(' < ')}). Must be sorted by scale rank, not alphabetically.`,
          alternatives: ['nominal_categorical', 'grouping_variable'],
          orderedLevels: ordered
        };
      }
    }

    const avgLen = uniqueVals.reduce((s, u) => s + u.length, 0) / nUnique;
    if (uniqueRatio === 1 && nValid >= 8 && avgLen < 24) {
      return {
        inferredType: 'identifier',
        physicalType: 'string',
        confidence: 'Moderate',
        isAmbiguous: true,
        reasoning: `Every row has a unique string label (${nUnique} distinct values). Likely an observation identifier or label.`,
        alternatives: ['nominal_categorical', 'text']
      };
    }
    if (avgLen > 45) {
      return {
        inferredType: 'text',
        physicalType: 'string',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `Long free-text strings (average length ${avgLen.toFixed(0)} characters).`,
        alternatives: ['nominal_categorical']
      };
    }
    if (/(^|_)(group|stratum|cohort|arm|regimen|chemistry|zone|division)($|_)/.test(nameLower) && nUnique <= 12) {
      return {
        inferredType: 'grouping_variable',
        physicalType: 'string',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `Low-cardinality categorical factor (${nUnique} groups) representing cohorts or strata.`,
        alternatives: ['nominal_categorical', 'ordinal_categorical']
      };
    }

    return {
      inferredType: 'nominal_categorical',
      physicalType: 'string',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Discrete qualitative categories (${nUnique} distinct classes).`,
      alternatives: ['grouping_variable', 'ordinal_categorical', 'identifier']
    };
  }

  // 7. Numeric Column Disambiguation
  const minVal = Math.min(...numericVals);
  const maxVal = Math.max(...numericVals);

  if (allIntegers && nUnique === nValid && nValid >= 8) {
    const sortedNums = [...numericVals].sort((a, b) => a - b);
    const isSequential = sortedNums.every((v, idx) => idx === 0 || (v - sortedNums[idx - 1] === 1));
    if (isSequential && (sortedNums[0] === 1 || sortedNums[0] === 0 || sortedNums[0] >= 1000)) {
      return {
        inferredType: 'identifier',
        physicalType: 'int64',
        confidence: 'Moderate',
        isAmbiguous: true,
        reasoning: `Strictly sequential integers (${sortedNums[0]} to ${sortedNums[nValid - 1]}). Likely an index or identifier rather than a measurement.`,
        alternatives: ['discrete_quantitative', 'count', 'date']
      };
    }
  }

  if (allIntegers && /(^|_)(year|yr)($|_)/.test(nameLower) && minVal >= 1800 && maxVal <= 2100) {
    return {
      inferredType: 'date',
      physicalType: 'int64',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Four-digit calendar year values (${minVal}–${maxVal}).`,
      alternatives: ['discrete_quantitative', 'ordinal_categorical']
    };
  }

  if (allIntegers && nUnique <= 5 && nValid >= 15 && minVal >= 1 && maxVal <= 5) {
    return {
      inferredType: 'ordinal_categorical',
      physicalType: 'int64',
      confidence: 'Moderate',
      isAmbiguous: true,
      reasoning: `Small integer set (${uniqueVals.sort().join(', ')}) repeated across ${nValid} rows. May represent an ordinal rating scale or discrete count.`,
      alternatives: ['discrete_quantitative', 'nominal_categorical', 'count'],
      orderedLevels: uniqueVals.sort((a, b) => Number(a) - Number(b))
    };
  }

  if (!allIntegers && minVal >= 0 && maxVal <= 1.0 && (/(prop|prob|share|ratio|fraction|rate)/.test(nameLower) || maxVal <= 1.0)) {
    if (/(prop|prob|share|fraction)/.test(nameLower)) {
      return {
        inferredType: 'proportion',
        physicalType: 'float64',
        confidence: 'High',
        isAmbiguous: false,
        reasoning: `Numeric values bounded in [0, 1] (${minVal.toFixed(3)} to ${maxVal.toFixed(3)}) with proportion semantics.`,
        alternatives: ['continuous_quantitative', 'rate']
      };
    }
  }

  if (/(rate|pct|percent|yield|efficacy)/.test(nameLower)) {
    return {
      inferredType: 'rate',
      physicalType: 'float64',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Rate or percentage variable ("${colName}", range ${minVal.toFixed(2)} to ${maxVal.toFixed(2)}).`,
      alternatives: ['continuous_quantitative', 'proportion']
    };
  }

  if (/(duration|elapsed|days|hours|minutes|seconds|latency|period|cycle_life)/.test(nameLower) && minVal >= 0) {
    return {
      inferredType: 'duration',
      physicalType: allIntegers ? 'int64' : 'float64',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Non-negative elapsed time or duration measurement ("${colName}").`,
      alternatives: ['continuous_quantitative', 'discrete_quantitative']
    };
  }

  if (allIntegers && minVal >= 0 && (/(count|admissions|cases|headcount|defects|arrivals|freq|n_|sample_size)/.test(nameLower))) {
    return {
      inferredType: 'count',
      physicalType: 'int64',
      confidence: 'High',
      isAmbiguous: false,
      reasoning: `Non-negative integer tally ("${colName}", range ${minVal} to ${maxVal}).`,
      alternatives: ['discrete_quantitative', 'continuous_quantitative']
    };
  }

  if (allIntegers) {
    return {
      inferredType: 'discrete_quantitative',
      physicalType: 'int64',
      confidence: nUnique <= 12 ? 'Moderate' : 'High',
      isAmbiguous: nUnique <= 8,
      reasoning: `Integer-valued quantitative variable (${nUnique} distinct integer values from ${minVal} to ${maxVal}).`,
      alternatives: ['continuous_quantitative', 'count', 'ordinal_categorical']
    };
  }

  return {
    inferredType: 'continuous_quantitative',
    physicalType: 'float64',
    confidence: 'High',
    isAmbiguous: false,
    reasoning: `Real-valued floating-point measurement (${minVal.toFixed(3)} to ${maxVal.toFixed(3)}).`,
    alternatives: ['discrete_quantitative', 'rate', 'proportion']
  };
}

/**
 * Profile an Entire Dataset (Part 6.2)
 */
export function profileDataset(rows, headers, userOverrides = {}, datasetMeta = {}) {
  const nRows = Array.isArray(rows) ? rows.length : 0;
  const colNames = headers && headers.length > 0
    ? headers
    : (nRows > 0 ? Object.keys(rows[0]).filter(k => k !== 'obs_id') : []);

  const variables = [];
  let totalMissingCells = 0;

  for (const colName of colNames) {
    const rawCol = rows.map(r => r[colName]);
    const override = userOverrides[colName] || {};
    const inference = inferVariableType(colName, rawCol, nRows, override);
    const tax = VARIABLE_TAXONOMY[inference.inferredType] || VARIABLE_TAXONOMY.unknown;

    let missingCount = 0;
    const nonNull = [];
    for (let i = 0; i < nRows; i++) {
      const v = rawCol[i];
      if (v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v))) {
        missingCount++;
      } else {
        nonNull.push(v);
      }
    }
    totalMissingCells += missingCount;
    const missingPct = nRows > 0 ? (missingCount / nRows) * 100 : 0;

    const freqMap = new Map();
    for (const v of nonNull) {
      const key = String(v);
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    }
    const frequencies = Array.from(freqMap.entries()).map(([value, count]) => ({
      value,
      count,
      proportion: nonNull.length > 0 ? count / nonNull.length : 0
    }));

    if (inference.orderedLevels && inference.orderedLevels.length > 0) {
      const orderIdx = new Map(inference.orderedLevels.map((l, idx) => [String(l).toLowerCase(), idx]));
      frequencies.sort((a, b) => {
        const ia = orderIdx.has(a.value.toLowerCase()) ? orderIdx.get(a.value.toLowerCase()) : 999;
        const ib = orderIdx.has(b.value.toLowerCase()) ? orderIdx.get(b.value.toLowerCase()) : 999;
        return ia - ib;
      });
    } else {
      frequencies.sort((a, b) => b.count - a.count);
    }

    const uniqueCount = freqMap.size;
    const representativeValues = Array.from(freqMap.keys()).slice(0, 5);

    const isNumericSemantic = ['quantitative', 'uncertainty', 'spatial'].includes(tax.family);
    const numStats = isNumericSemantic ? computeUnivariateStats(nonNull) : null;

    let dateRange = null;
    if (tax.family === 'temporal' && nonNull.length > 0) {
      const sortedDates = [...nonNull].map(String).sort();
      dateRange = { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] };
    }

    variables.push({
      name: colName,
      label: override.label || colName,
      unit: override.unit || (datasetMeta.units && datasetMeta.units[colName]) || '',
      role: override.role || (datasetMeta.roles && datasetMeta.roles[colName]) || 'attribute',
      inferredType: inference.inferredType,
      taxonomy: tax,
      physicalType: inference.physicalType,
      confidence: inference.confidence,
      isAmbiguous: inference.isAmbiguous,
      reasoning: inference.reasoning,
      alternatives: inference.alternatives,
      orderedLevels: inference.orderedLevels,
      nValid: nonNull.length,
      missingCount,
      missingPct,
      uniqueCount,
      representativeValues,
      numericStats: numStats && numStats.valid ? numStats : null,
      frequencies: frequencies.slice(0, 25),
      allFrequencies: frequencies,
      dateRange
    });
  }

  return {
    rowCount: nRows,
    colCount: colNames.length,
    totalMissingCells,
    completeCaseCount: rows.filter(r => colNames.every(c => r[c] !== null && r[c] !== undefined && r[c] !== '')).length,
    headers: colNames,
    variables,
    variableMap: Object.fromEntries(variables.map(v => [v.name, v]))
  };
}

/**
 * Non-Destructive Data Transformation Engine (Part 6.5)
 */
export function applyTransformationStep(datasetState, step) {
  const { rows, headers } = datasetState;
  const clonedRows = rows.map(r => ({ ...r }));
  const clonedHeaders = [...headers];

  switch (step.type) {
    case 'sort': {
      const { column, direction = 'asc' } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const mult = direction === 'desc' ? -1 : 1;
      clonedRows.sort((a, b) => {
        const va = a[column];
        const vb = b[column];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * mult;
        }
        return String(va).localeCompare(String(vb)) * mult;
      });
      return {
        rows: clonedRows,
        headers: clonedHeaders,
        description: `Sorted by "${column}" (${direction.toUpperCase()}) on ${clonedRows.length} rows.`
      };
    }

    case 'filter': {
      const { column, operator, value } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const numTarget = Number(value);
      const filtered = clonedRows.filter(r => {
        const cell = r[column];
        if (operator === 'not_null') return cell !== null && cell !== undefined && cell !== '';
        if (cell === null || cell === undefined || cell === '') return false;
        if (operator === 'eq') return String(cell).toLowerCase() === String(value).toLowerCase();
        if (operator === 'neq') return String(cell).toLowerCase() !== String(value).toLowerCase();
        if (operator === 'contains') return String(cell).toLowerCase().includes(String(value).toLowerCase());
        const cNum = Number(cell);
        if (!Number.isFinite(cNum) || !Number.isFinite(numTarget)) return false;
        if (operator === 'gt') return cNum > numTarget;
        if (operator === 'gte') return cNum >= numTarget;
        if (operator === 'lt') return cNum < numTarget;
        if (operator === 'lte') return cNum <= numTarget;
        return true;
      });
      return {
        rows: filtered,
        headers: clonedHeaders,
        description: `Filtered "${column}" (${operator} ${value ?? ''}): kept ${filtered.length} of ${clonedRows.length} rows.`
      };
    }

    case 'rename_variable': {
      const { oldName, newName } = step;
      const cleanNew = String(newName || '').trim();
      if (!cleanNew || !clonedHeaders.includes(oldName) || clonedHeaders.includes(cleanNew)) {
        return datasetState;
      }
      const nextHeaders = clonedHeaders.map(h => (h === oldName ? cleanNew : h));
      const nextRows = clonedRows.map(r => {
        const copy = { ...r, [cleanNew]: r[oldName] };
        delete copy[oldName];
        return copy;
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Renamed variable "${oldName}" to "${cleanNew}".`
      };
    }

    case 'select_columns': {
      const selected = (step.columns || []).filter(c => clonedHeaders.includes(c));
      if (selected.length === 0) return datasetState;
      const nextRows = clonedRows.map(r => {
        const obj = { obs_id: r.obs_id };
        for (const col of selected) obj[col] = r[col];
        return obj;
      });
      return {
        rows: nextRows,
        headers: selected,
        description: `Selected ${selected.length} of ${clonedHeaders.length} columns.`
      };
    }

    case 'standardize_z': {
      const { column } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const stats = computeUnivariateStats(clonedRows.map(r => r[column]));
      if (!stats.valid || stats.sd <= EPSILON) return datasetState;
      const newCol = `${column}_z`;
      const nextHeaders = clonedHeaders.includes(newCol) ? clonedHeaders : [...clonedHeaders, newCol];
      const nextRows = clonedRows.map(r => {
        const v = Number(r[column]);
        return {
          ...r,
          [newCol]: Number.isFinite(v) ? Number(((v - stats.mean) / stats.sd).toFixed(5)) : null
        };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Created standardized Z-score column "${newCol}" (mean = ${stats.mean.toFixed(3)}, s = ${stats.sd.toFixed(3)}).`
      };
    }

    case 'log_transform': {
      const { column, base = 'ln' } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const newCol = `${column}_${base === 'log10' ? 'log10' : 'ln'}`;
      const nextHeaders = clonedHeaders.includes(newCol) ? clonedHeaders : [...clonedHeaders, newCol];
      let invalidCount = 0;
      const nextRows = clonedRows.map(r => {
        const v = Number(r[column]);
        if (!Number.isFinite(v) || v <= 0) {
          invalidCount++;
          return { ...r, [newCol]: null };
        }
        const val = base === 'log10' ? Math.log10(v) : Math.log(v);
        return { ...r, [newCol]: Number(val.toFixed(5)) };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Created ${base.toUpperCase()} column "${newCol}" (${invalidCount > 0 ? `${invalidCount} non-positive values set to null` : 'all values strictly positive'}).`
      };
    }

    case 'cumulative_total': {
      const { column } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const newCol = `${column}_cumsum`;
      const nextHeaders = clonedHeaders.includes(newCol) ? clonedHeaders : [...clonedHeaders, newCol];
      let running = 0;
      const nextRows = clonedRows.map(r => {
        const v = Number(r[column]);
        if (Number.isFinite(v)) running += v;
        return { ...r, [newCol]: Number(running.toFixed(4)) };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Computed cumulative running total "${newCol}" from "${column}".`
      };
    }

    case 'binning': {
      const { column, bins = 5 } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const stats = computeUnivariateStats(clonedRows.map(r => r[column]));
      if (!stats.valid || stats.isConstant) return datasetState;
      const k = Math.max(2, Math.min(20, Number(bins) || 5));
      const width = (stats.max - stats.min) / k;
      const newCol = `${column}_bin`;
      const nextHeaders = clonedHeaders.includes(newCol) ? clonedHeaders : [...clonedHeaders, newCol];
      const nextRows = clonedRows.map(r => {
        const v = Number(r[column]);
        if (!Number.isFinite(v)) return { ...r, [newCol]: null };
        const idx = Math.min(k - 1, Math.max(0, Math.floor((v - stats.min) / width)));
        const low = (stats.min + idx * width).toFixed(2);
        const high = (stats.min + (idx + 1) * width).toFixed(2);
        return { ...r, [newCol]: `[${low}, ${high}]` };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Discretized "${column}" into ${k} equal-width interval bins in "${newCol}".`
      };
    }

    case 'date_extract': {
      const { column, part = 'year' } = step;
      if (!clonedHeaders.includes(column)) return datasetState;
      const newCol = `${column}_${part}`;
      const nextHeaders = clonedHeaders.includes(newCol) ? clonedHeaders : [...clonedHeaders, newCol];
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const nextRows = clonedRows.map(r => {
        const raw = String(r[column] ?? '');
        const match = raw.match(/^(\d{4})(?:[-/](\d{1,2}))?/);
        let extracted = null;
        if (match) {
          if (part === 'year') extracted = Number(match[1]);
          else if (part === 'month' && match[2]) {
            const mIdx = Math.max(1, Math.min(12, Number(match[2]))) - 1;
            extracted = monthNamesShort[mIdx];
          }
        }
        return { ...r, [newCol]: extracted };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Extracted calendar ${part} into "${newCol}" from "${column}".`
      };
    }

    case 'derived_expression': {
      const { colA, colB, operation = 'diff', newName } = step;
      if (!clonedHeaders.includes(colA) || !clonedHeaders.includes(colB)) return datasetState;
      const outCol = (newName && String(newName).trim()) || `${colA}_${operation}_${colB}`;
      const nextHeaders = clonedHeaders.includes(outCol) ? clonedHeaders : [...clonedHeaders, outCol];
      const nextRows = clonedRows.map(r => {
        const a = Number(r[colA]);
        const b = Number(r[colB]);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return { ...r, [outCol]: null };
        let res = null;
        if (operation === 'sum') res = a + b;
        else if (operation === 'diff') res = a - b;
        else if (operation === 'prod') res = a * b;
        else if (operation === 'ratio') res = Math.abs(b) > EPSILON ? a / b : null;
        else if (operation === 'pct_change') res = Math.abs(a) > EPSILON ? ((b - a) / a) * 100 : null;
        return { ...r, [outCol]: res !== null ? Number(res.toFixed(4)) : null };
      });
      return {
        rows: nextRows,
        headers: nextHeaders,
        description: `Computed derived variable "${outCol}" (${colA} ${operation} ${colB}).`
      };
    }

    case 'group_aggregate': {
      const { groupColumn, targetColumn, aggFunc = 'mean' } = step;
      if (!clonedHeaders.includes(groupColumn)) return datasetState;
      const groups = new Map();
      let validTotal = 0;
      for (const r of clonedRows) {
        const gKey = r[groupColumn];
        if (gKey === null || gKey === undefined || gKey === '') continue;
        const keyStr = String(gKey);
        if (!groups.has(keyStr)) groups.set(keyStr, []);
        groups.get(keyStr).push(r);
        validTotal++;
      }

      const aggColName = aggFunc === 'count' || aggFunc === 'relative_frequency' || aggFunc === 'percentage'
        ? `${groupColumn}_${aggFunc}`
        : `${targetColumn}_${aggFunc}`;
      const nextRows = [];
      let idx = 1;
      for (const [gKey, gRows] of groups.entries()) {
        const count = gRows.length;
        const relFreq = validTotal > 0 ? count / validTotal : 0;
        let val = count;
        if (aggFunc === 'relative_frequency') val = Number(relFreq.toFixed(4));
        else if (aggFunc === 'percentage') val = Number((relFreq * 100).toFixed(2));
        else if (targetColumn && clonedHeaders.includes(targetColumn)) {
          const stats = computeUnivariateStats(gRows.map(x => x[targetColumn]));
          if (stats.valid) {
            if (aggFunc === 'sum') val = Number(stats.sum.toFixed(4));
            else if (aggFunc === 'mean') val = Number(stats.mean.toFixed(4));
            else if (aggFunc === 'median') val = Number(stats.median.toFixed(4));
            else if (aggFunc === 'min') val = Number(stats.min.toFixed(4));
            else if (aggFunc === 'max') val = Number(stats.max.toFixed(4));
            else if (aggFunc === 'sd') val = Number(stats.sd.toFixed(4));
          } else {
            val = null;
          }
        }
        nextRows.push({
          obs_id: `grp_${idx++}`,
          [groupColumn]: gKey,
          group_n: count,
          [aggColName]: val
        });
      }

      return {
        rows: nextRows,
        headers: [groupColumn, 'group_n', aggColName],
        description: `Grouped by "${groupColumn}" and aggregated "${aggColName}" across ${nextRows.length} groups (N = ${validTotal}).`
      };
    }

    default:
      return datasetState;
  }
}

/**
 * Execute a sequence of transformations on raw source data, returning active dataset and provenance log.
 */
export function runTransformationPipeline(rawRows, rawHeaders, steps = []) {
  let state = {
    rows: rawRows.map(r => ({ ...r })),
    headers: [...rawHeaders]
  };
  const provenanceLog = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const next = applyTransformationStep(state, step);
    provenanceLog.push({
      stepIndex: i + 1,
      type: step.type,
      params: step,
      description: next.description || `Applied ${step.type}`,
      rowCountAfter: next.rows.length,
      colCountAfter: next.headers.length
    });
    state = { rows: next.rows, headers: next.headers };
  }

  return {
    rows: state.rows,
    headers: state.headers,
    provenanceLog
  };
}

/**
 * Parse all 4 DataSense v1.0.0 Interchange JSON Schemas & VisualGrammar Saved Configurations:
 * 1. DataSenseDataset (DATA_CONVENTIONS.md Section E.1)
 * 2. DataSenseModelOutput (QuartetLab — DATA_CONVENTIONS.md Section E.2)
 * 3. DataSenseSimulationResult (ResampleLab — DATA_CONVENTIONS.md Section E.3)
 * 4. DataSenseForecastResult (ForecastLab — DATA_CONVENTIONS.md Section E.4)
 */
export function parseDataSenseJSON(jsonString) {
  try {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid JSON payload.' };
    }

    // 0. Check if it is a VisualGrammar Saved Configuration wrapper containing .dataset
    if (parsed.dataset && Array.isArray(parsed.dataset.observations)) {
      const inner = parseDataSenseJSON(parsed.dataset);
      return {
        ...inner,
        savedChartConfig: parsed.chartConfig || inner.savedChartConfig || null,
        savedTransformations: parsed.transformationPipeline || [],
        savedExplanationLevel: parsed.explanationLevel || null
      };
    }

    // 1. Check DataSenseModelOutput (QuartetLab / STAT2 Regression & Diagnostics Schema — Section E.2)
    if (parsed.$schema === 'https://datasense.studio/schemas/v1/model-output.json' || Array.isArray(parsed.observation_diagnostics)) {
      const diagList = parsed.observation_diagnostics || [];
      if (diagList.length === 0) {
        return { valid: false, error: 'DataSenseModelOutput contains an empty observation_diagnostics array.' };
      }
      const rows = diagList.map((d, idx) => ({
        obs_id: d.obs_id || `obs_${idx + 1}`,
        x_predictor: d.x !== undefined ? Number(d.x) : idx + 1,
        y_observed: d.y !== undefined ? Number(d.y) : Number((d.fitted + d.residual).toFixed(4)),
        fitted: Number(d.fitted),
        residual: Number(d.residual),
        std_residual: Number(d.std_residual ?? 0),
        studentized_residual: Number(d.studentized_residual ?? d.std_residual ?? 0),
        leverage_hii: Number(d.leverage_hii ?? 0),
        cooks_d: Number(d.cooks_d ?? 0),
        flagged_influential: d.flagged_influential ? 'Influential' : 'Normal'
      }));
      const headers = ['obs_id', 'x_predictor', 'y_observed', 'fitted', 'residual', 'studentized_residual', 'leverage_hii', 'cooks_d', 'flagged_influential'];
      return {
        valid: true,
        isDataSenseSchema: true,
        schemaType: 'DataSenseModelOutput',
        metadata: {
          id: parsed.dataset_id || 'quartetlab_model_output',
          title: `QuartetLab Model Diagnostics (${parsed.formula || 'y ~ x'})`,
          description: `Imported DataSenseModelOutput from ${parsed.source_app || 'QuartetLab'} (R² = ${parsed.fit_statistics?.r_squared ?? 'N/A'}, s = ${parsed.fit_statistics?.s_residual ?? 'N/A'}).`
        },
        headers,
        rows,
        overrides: {
          obs_id: { overrideType: 'identifier' },
          x_predictor: { overrideType: 'continuous_quantitative' },
          y_observed: { overrideType: 'continuous_quantitative' },
          fitted: { overrideType: 'continuous_quantitative' },
          residual: { overrideType: 'continuous_quantitative' },
          studentized_residual: { overrideType: 'continuous_quantitative' },
          leverage_hii: { overrideType: 'derived_statistic' },
          cooks_d: { overrideType: 'derived_statistic' },
          flagged_influential: { overrideType: 'binary_categorical' }
        },
        savedChartConfig: {
          chartType: 'residual_fitted',
          x: 'x_predictor',
          y: 'y_observed',
          color: 'flagged_influential',
          title: `QuartetLab Residual & Influence Diagnostics (${parsed.formula || 'y ~ x'})`
        }
      };
    }

    // 2. Check DataSenseSimulationResult (ResampleLab Bootstrap / Permutation Schema — Section E.3)
    if (parsed.$schema === 'https://datasense.studio/schemas/v1/simulation-result.json' || Array.isArray(parsed.replicate_distribution)) {
      const reps = parsed.replicate_distribution || [];
      if (reps.length === 0) {
        return { valid: false, error: 'DataSenseSimulationResult contains an empty replicate_distribution array.' };
      }
      const obsStat = Number(parsed.observed_statistic ?? 0);
      const ciLow = Number(parsed.confidence_interval?.lower ?? obsStat);
      const ciHigh = Number(parsed.confidence_interval?.upper ?? obsStat);
      const rows = reps.map((val, idx) => {
        const v = Number(val);
        return {
          obs_id: `rep_${idx + 1}`,
          replicate_index: idx + 1,
          replicate_stat: v,
          observed_stat: obsStat,
          ci95_low: ciLow,
          ci95_high: ciHigh,
          tail_region: (v < ciLow || v > ciHigh) ? 'Outside 95% CI' : 'Inside 95% CI'
        };
      });
      const headers = ['replicate_index', 'replicate_stat', 'observed_stat', 'ci95_low', 'ci95_high', 'tail_region'];
      return {
        valid: true,
        isDataSenseSchema: true,
        schemaType: 'DataSenseSimulationResult',
        metadata: {
          id: parsed.dataset_id || 'resamplelab_simulation',
          title: `ResampleLab ${parsed.method || 'Bootstrap'} Distribution (${parsed.target_statistic || 'Statistic'})`,
          description: `Imported DataSenseSimulationResult from ${parsed.source_app || 'ResampleLab'} (B = ${reps.length}, SE = ${parsed.bootstrap_se ?? 'N/A'}, 95% CI [${ciLow}, ${ciHigh}]).`
        },
        headers,
        rows,
        overrides: {
          replicate_index: { overrideType: 'identifier' },
          replicate_stat: { overrideType: 'continuous_quantitative' },
          observed_stat: { overrideType: 'derived_statistic' },
          ci95_low: { overrideType: 'derived_statistic' },
          ci95_high: { overrideType: 'derived_statistic' },
          tail_region: { overrideType: 'binary_categorical' }
        },
        savedChartConfig: {
          chartType: 'histogram',
          x: 'replicate_stat',
          y: '',
          color: 'tail_region',
          histScale: 'density',
          referenceLineValue: String(obsStat),
          annotationText: `Observed = ${obsStat.toFixed(2)} | 95% CI [${ciLow.toFixed(2)}, ${ciHigh.toFixed(2)}]`,
          title: `ResampleLab Sampling Distribution (${parsed.method || 'Bootstrap'}, B = ${reps.length})`
        }
      };
    }

    // 3. Check DataSenseForecastResult (ForecastLab Horizon & Prediction Intervals Schema — Section E.4)
    if (parsed.$schema === 'https://datasense.studio/schemas/v1/forecast-result.json' || Array.isArray(parsed.forecasts)) {
      const fcList = parsed.forecasts || [];
      if (fcList.length === 0) {
        return { valid: false, error: 'DataSenseForecastResult contains an empty forecasts array.' };
      }
      const rows = fcList.map((f, idx) => ({
        obs_id: `h_${idx + 1}`,
        time: String(f.time || `T+${idx + 1}`),
        point_estimate: Number(f.mean),
        ci_low: Number(f.pi_80 ? f.pi_80[0] : f.mean),
        ci_high: Number(f.pi_80 ? f.pi_80[1] : f.mean),
        pred95_low: Number(f.pi_95 ? f.pi_95[0] : (f.pi_80 ? f.pi_80[0] : f.mean)),
        pred95_high: Number(f.pi_95 ? f.pi_95[1] : (f.pi_80 ? f.pi_80[1] : f.mean))
      }));
      const headers = ['time', 'point_estimate', 'ci_low', 'ci_high', 'pred95_low', 'pred95_high'];
      return {
        valid: true,
        isDataSenseSchema: true,
        schemaType: 'DataSenseForecastResult',
        metadata: {
          id: parsed.dataset_id || 'forecastlab_horizon',
          title: `ForecastLab ${parsed.model_name || 'Time-Series'} Forecast (h = ${fcList.length})`,
          description: `Imported DataSenseForecastResult from ${parsed.source_app || 'ForecastLab'} with 80% and 95% prediction intervals (RMSE = ${parsed.accuracy_metrics?.rmse ?? 'N/A'}).`
        },
        headers,
        rows,
        overrides: {
          time: { overrideType: 'date' },
          point_estimate: { overrideType: 'derived_statistic' },
          ci_low: { overrideType: 'derived_statistic' },
          ci_high: { overrideType: 'derived_statistic' },
          pred95_low: { overrideType: 'derived_statistic' },
          pred95_high: { overrideType: 'derived_statistic' }
        },
        savedChartConfig: {
          chartType: 'interval_ribbon',
          x: 'time',
          y: 'point_estimate',
          uncertaintyType: 'pi95',
          title: `ForecastLab Horizon Fan (${parsed.model_name || 'ETS/ARIMA'} — 80% & 95% Prediction Intervals)`
        }
      };
    }

    // 4. Standard DataSenseDataset v1.0.0 (Section E.1)
    if (Array.isArray(parsed.observations) && parsed.observations.length > 0) {
      const headers = Array.isArray(parsed.variables) && parsed.variables.length > 0
        ? parsed.variables.map(v => v.name)
        : Object.keys(parsed.observations[0]).filter(k => k !== 'obs_id');
      const overrides = {};
      if (Array.isArray(parsed.variables)) {
        for (const v of parsed.variables) {
          if (v.semanticType && VARIABLE_TAXONOMY[v.semanticType]) {
            overrides[v.name] = {
              overrideType: v.semanticType,
              label: v.label || v.name,
              unit: v.unit || '',
              role: v.role || 'attribute'
            };
          }
        }
      }
      return {
        valid: true,
        isDataSenseSchema: true,
        schemaType: 'DataSenseDataset',
        metadata: parsed.metadata || { title: 'Imported DataSense Dataset' },
        headers,
        rows: parsed.observations.map((obs, idx) => ({
          obs_id: obs.obs_id || `obs_${idx + 1}`,
          ...obs
        })),
        overrides,
        savedChartConfig: parsed.chartConfig || null
      };
    }

    return { valid: false, error: 'JSON does not match a recognized DataSense schema (observations, observation_diagnostics, replicate_distribution, or forecasts).' };
  } catch (err) {
    return { valid: false, error: `JSON Parse Error: ${err.message}` };
  }
}

/**
 * Built-in Ecosystem Interchange Generators for QuartetLab, ResampleLab, and ForecastLab
 */
export function getSampleQuartetLabModelOutputJSON() {
  return JSON.stringify({
    $schema: 'https://datasense.studio/schemas/v1/model-output.json',
    schema_version: '1.0.0',
    source_app: 'QuartetLab',
    model_type: 'ols_simple',
    dataset_id: 'quartetlab_anscombe_3',
    formula: 'y ~ x',
    fit_statistics: {
      n: 11,
      df_model: 1,
      df_residual: 9,
      r_squared: 0.6663,
      adj_r_squared: 0.6292,
      s_residual: 1.2363,
      f_statistic: 17.972,
      p_value_model: 0.00217
    },
    observation_diagnostics: [
      { obs_id: 'obs_1', x: 10.0, y: 7.46, fitted: 7.9997, residual: -0.5397, std_residual: -0.460, studentized_residual: -0.440, leverage_hii: 0.100, cooks_d: 0.012, flagged_influential: false },
      { obs_id: 'obs_2', x: 8.0, y: 6.77, fitted: 7.0003, residual: -0.2303, std_residual: -0.196, studentized_residual: -0.186, leverage_hii: 0.100, cooks_d: 0.002, flagged_influential: false },
      { obs_id: 'obs_3', x: 13.0, y: 12.74, fitted: 9.4989, residual: 3.2411, std_residual: 3.028, studentized_residual: 112.7, leverage_hii: 0.236, cooks_d: 1.418, flagged_influential: true },
      { obs_id: 'obs_4', x: 9.0, y: 7.11, fitted: 7.5000, residual: -0.3900, std_residual: -0.330, studentized_residual: -0.313, leverage_hii: 0.091, cooks_d: 0.005, flagged_influential: false },
      { obs_id: 'obs_5', x: 11.0, y: 7.81, fitted: 8.4995, residual: -0.6895, std_residual: -0.598, studentized_residual: -0.575, leverage_hii: 0.127, cooks_d: 0.026, flagged_influential: false },
      { obs_id: 'obs_6', x: 14.0, y: 8.84, fitted: 9.9986, residual: -1.1586, std_residual: -1.144, studentized_residual: -1.167, leverage_hii: 0.318, cooks_d: 0.305, flagged_influential: false },
      { obs_id: 'obs_7', x: 6.0, y: 6.08, fitted: 6.0008, residual: 0.0792, std_residual: 0.071, studentized_residual: 0.067, leverage_hii: 0.173, cooks_d: 0.001, flagged_influential: false },
      { obs_id: 'obs_8', x: 4.0, y: 5.39, fitted: 5.0014, residual: 0.3886, std_residual: 0.384, studentized_residual: 0.365, leverage_hii: 0.318, cooks_d: 0.034, flagged_influential: false },
      { obs_id: 'obs_9', x: 12.0, y: 8.15, fitted: 8.9992, residual: -0.8492, std_residual: -0.762, studentized_residual: -0.742, leverage_hii: 0.173, cooks_d: 0.061, flagged_influential: false },
      { obs_id: 'obs_10', x: 7.0, y: 6.42, fitted: 6.5005, residual: -0.0805, std_residual: -0.070, studentized_residual: -0.066, leverage_hii: 0.127, cooks_d: 0.000, flagged_influential: false },
      { obs_id: 'obs_11', x: 5.0, y: 5.73, fitted: 5.5011, residual: 0.2289, std_residual: 0.214, studentized_residual: 0.202, leverage_hii: 0.236, cooks_d: 0.007, flagged_influential: false }
    ]
  }, null, 2);
}

export function getSampleResampleLabJSON() {
  return JSON.stringify({
    $schema: 'https://datasense.studio/schemas/v1/simulation-result.json',
    schema_version: '1.0.0',
    source_app: 'ResampleLab',
    dataset_id: 'resamplelab_wafer_boot',
    method: 'nonparametric_bootstrap',
    target_statistic: 'mean_difference',
    prng_algorithm: 'mulberry32',
    seed: 20260510,
    replications: 40,
    observed_statistic: 11.94,
    bootstrap_mean: 11.91,
    bootstrap_se: 0.84,
    confidence_interval: {
      level: 0.95,
      method: 'percentile',
      lower: 10.28,
      upper: 13.56
    },
    replicate_distribution: [
      10.12, 10.45, 10.68, 10.82, 10.95, 11.04, 11.15, 11.22, 11.31, 11.40,
      11.48, 11.55, 11.61, 11.69, 11.74, 11.80, 11.85, 11.89, 11.92, 11.95,
      11.99, 12.04, 12.09, 12.14, 12.20, 12.26, 12.33, 12.41, 12.49, 12.58,
      12.67, 12.76, 12.88, 12.97, 13.10, 13.24, 13.38, 13.52, 13.68, 13.89
    ]
  }, null, 2);
}

export function getSampleForecastLabJSON() {
  return JSON.stringify({
    $schema: 'https://datasense.studio/schemas/v1/forecast-result.json',
    schema_version: '1.0.0',
    source_app: 'ForecastLab',
    dataset_id: 'forecastlab_grid_ets',
    model_name: 'ETS(M,A,M)',
    horizon: 8,
    frequency: 'monthly',
    accuracy_metrics: {
      rmse: 11.8,
      mae: 9.2,
      mape: 2.1,
      mase: 0.68
    },
    forecasts: [
      { time: '2026-01', mean: 538.0, pi_80: [522.4, 553.6], pi_95: [514.1, 561.9] },
      { time: '2026-02', mean: 506.5, pi_80: [489.0, 524.0], pi_95: [479.8, 533.2] },
      { time: '2026-03', mean: 454.2, pi_80: [435.1, 473.3], pi_95: [425.0, 483.4] },
      { time: '2026-04', mean: 408.8, pi_80: [388.2, 429.4], pi_95: [377.3, 440.3] },
      { time: '2026-05', mean: 429.4, pi_80: [407.1, 451.7], pi_95: [395.3, 463.5] },
      { time: '2026-06', mean: 518.0, pi_80: [494.0, 542.0], pi_95: [481.3, 554.7] },
      { time: '2026-07', mean: 598.6, pi_80: [572.5, 624.7], pi_95: [558.7, 638.5] },
      { time: '2026-08', mean: 586.2, pi_80: [558.4, 614.0], pi_95: [543.7, 628.7] }
    ]
  }, null, 2);
}
