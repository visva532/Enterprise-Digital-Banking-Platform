export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const OCCUPATIONS = [
  { value: "SALARIED", label: "Salaried" },
  { value: "SELF_EMPLOYED", label: "Self-employed" },
  { value: "BUSINESS", label: "Business" },
  { value: "STUDENT", label: "Student" },
  { value: "RETIRED", label: "Retired" },
  { value: "HOMEMAKER", label: "Homemaker" },
  { value: "OTHER", label: "Other" },
];

export const INCOME_RANGES = [
  { value: "UPTO_2_5L", label: "Up to 2.5 lakh" },
  { value: "FROM_2_5_TO_5L", label: "2.5 to 5 lakh" },
  { value: "FROM_5_TO_10L", label: "5 to 10 lakh" },
  { value: "FROM_10_TO_25L", label: "10 to 25 lakh" },
  { value: "ABOVE_25L", label: "Above 25 lakh" },
];

export const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;