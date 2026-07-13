export interface NrlOkhlaItem {
  skuId: string;
  doseCode: string;
  testName: string;
  newDelhi: 'Inhouse' | 'Outsource';
  runDay: string;
}

export const NRL_OKHLA_DATA: NrlOkhlaItem[] = [
  // Page 1
  { skuId: '33462', doseCode: 'LFSMBC01GUR', testName: 'Coronavirus Covid-19 Test (RT-PCR technique)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1717', doseCode: 'LFSHE8GUR', testName: 'Complete Blood Count', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1783', doseCode: 'LFSBI88GUR', testName: 'Glucose - Fasting', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1680', doseCode: 'LFSDP0002', testName: 'Diabetes Screening', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1611', doseCode: 'LFSBI90GUR', testName: 'HbA1c (Glycosylated Hemoglobin)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1784', doseCode: 'LFSBI190GUR', testName: 'Glucose - Postprandial', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1977', doseCode: 'LFSIM150GUR', testName: 'Thyroid Stimulating Hormone, Ultrasensitive', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2374', doseCode: 'LFSCP5GUR', testName: 'Urine Routine & Microscopy', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2571', doseCode: 'LFSIM149GUR', testName: 'Thyroid profile Total', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2562', doseCode: 'LFSBI125GUR', testName: 'Liver Function Test', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1909', doseCode: 'LFSBI120GUR', testName: 'Lipid Profile', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1729', doseCode: 'LFSBI64GUR', testName: 'C- Reactive Protein Quantitative', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1731', doseCode: 'LFSBI69GUR', testName: 'Creatinine', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1417', doseCode: 'LFSHE17GUR', testName: 'Erythrocyte Sedimentation Rate', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '34917', doseCode: '1MGIM0005', testName: 'Covid Antibody IgG (Quantitative)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1785', doseCode: 'LFSBI89GUR', testName: 'Glucose - Random', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1388', doseCode: 'LFSIM179GUR', testName: 'Vitamin B12', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1963', doseCode: 'LFSBI172GUR', testName: 'Uric Acid,Serum', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1837', doseCode: 'LFSIM86GUR', testName: 'Hepatitis B Surface Antigen (HBsAg), Rapid Screening Test', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1761', doseCode: 'LFSBI164GUR', testName: 'Serum Electrolyte', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1838', doseCode: 'LFSHE28GUR', testName: 'Haemoglobin', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2102', doseCode: 'LFSHE7GUR', testName: 'Blood Group ABO & RH Factor Test', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1972', doseCode: 'LFSIM183GUR', testName: 'Vitamin D (25-OH)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1321', doseCode: 'LFSIM148GUR', testName: 'Thyroid Profile Free', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1495', doseCode: 'LFSIM64GUR', testName: 'Ferritin', newDelhi: 'Inhouse', runDay: 'Daily' },

  // Page 2
  { skuId: '1810', doseCode: 'LFSIM90GUR', testName: 'Hepatitis C Antibody (HCV), Rapid Screening Test', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1366', doseCode: 'LFSHE15GUR', testName: 'D-Dimer', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1819', doseCode: 'LFSIM108GUR', testName: 'HIV 1 and 2 Antibody, Rapid Screening Test', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1903', doseCode: 'LFSBI149GUR', testName: 'Potassium', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1743', doseCode: 'LFSHE10GUR', testName: 'Complete Haemogram', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1318', doseCode: 'LFSBI45GUR', testName: 'Calcium', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1906', doseCode: 'LFSIM133GUR', testName: 'Prolactin', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2142', doseCode: 'LFSBI8GUR', testName: 'SGPT (Alanine Transaminase)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2540', doseCode: 'LFSIM41GUR', testName: 'HCG Beta Total Quantitative, Maternal', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1994', doseCode: 'LFSIM136GUR', testName: 'Prostate Specific Antigen (Total) PSA', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1914', doseCode: 'LFSHESMH01', testName: 'PT INR (Prothrombin Time with INR)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1949', doseCode: 'LFSIM152GUR', testName: 'Thyroxine - Free (FT4)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1921', doseCode: 'LFSSE76GUR', testName: 'Rheumatoid Factor - Quantitative', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1888', doseCode: 'LFSSE74GUR', testName: 'RPR (Rapid Plasma Reagin)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2348', doseCode: 'LFSBI165GUR', testName: 'Sodium', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2536', doseCode: 'LFSIM145GUR', testName: 'Testosterone Total', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1670', doseCode: 'LFSIM36GUR', testName: 'Anti-Mullerian Hormone (AMH)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1970', doseCode: 'LFSSE81GUR', testName: 'Widal Test (Slide Agglutination)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1441', doseCode: 'LFSBI111GUR', testName: 'Lactate Dehydrogenase, Serum', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1952', doseCode: 'LFSIM166GUR', testName: 'Total IgE (Immunoglobulin E)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2168', doseCode: 'BI012', testName: 'Aspartate Aminotransferase (SGOT/AST)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1694', doseCode: 'LFSHE29GUR', testName: 'Hb HPLC (Hemoglobin Variants Estimation by HPLC)', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1363', doseCode: 'LFSPVIT46GUR', testName: 'Vitamin Profile', newDelhi: 'Inhouse', runDay: 'Daily' },

  // Page 5
  { skuId: '2236', doseCode: 'LFSIM23GUR', testName: 'Alpha Feto Protein, Tumour Marker', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2111', doseCode: 'LFSIM137GUR', testName: 'Quadruple Marker with Graph - 2nd Trimester', newDelhi: 'Inhouse', runDay: 'Every alternate day' },
  { skuId: '36997', doseCode: '1MGMI0066', testName: 'Culture Aerobic Blood (Automated), Adult', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2225', doseCode: '1MGMI0067', testName: 'Culture Aerobic Blood (Automated), Pediatric', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '1821', doseCode: 'LFSMB43GUR', testName: 'HLA B-27, Flowcytometry', newDelhi: 'Outsource', runDay: 'Batch decided as per sample load' },
  { skuId: '2051', doseCode: 'LFSIM89GUR', testName: 'Hepatitis B Virus - Viral Load, Quantitative (PCR)', newDelhi: 'Inhouse', runDay: 'Mon, Wed and Fri' },
  { skuId: '2064', doseCode: 'LFSMB44GUR', testName: 'Human Leukocyte Antigen B27 (PCR)', newDelhi: 'Inhouse', runDay: 'Mon, Wed and Fri' },
  { skuId: '1910', doseCode: 'LFSBI154GUR', testName: 'Protein Electrophoresis, Serum', newDelhi: 'Inhouse', runDay: 'Every alternate day' },
  { skuId: '2276', doseCode: 'LFSIM29GUR', testName: 'Anti Cardiolipin IgM Antibody', newDelhi: 'Inhouse', runDay: 'Tuesday' },

  // Page 11
  { skuId: '2405', doseCode: 'LFSBI143GUR', testName: 'Parietal Cell Antibody', newDelhi: 'Inhouse', runDay: 'Batch decided as per sample load' },
  { skuId: '1672', doseCode: 'LFSBI16GUR', testName: 'Aldosterone', newDelhi: 'Outsource', runDay: 'Batch decided as per sample load' },
  { skuId: '2670', doseCode: 'LFSBI84GUR', testName: 'Globulin, Serum', newDelhi: 'Inhouse', runDay: 'Daily' },
  { skuId: '2053', doseCode: 'LFSMB39GUR', testName: 'Hepatitis C Virus - Genotyping', newDelhi: 'Inhouse', runDay: 'Wednesday' },
  { skuId: '2302', doseCode: 'LFSBI100GUR', testName: 'Inhibin A', newDelhi: 'Inhouse', runDay: 'Every alternate day' },

  // Page 12
  { skuId: '1472', doseCode: 'LFSIM62GUR', testName: 'Estriol Unconjugated', newDelhi: 'Inhouse', runDay: 'Every alternate day' },
  { skuId: '1966', doseCode: 'LFSIM175GUR', testName: 'Varicella Zoster IgG', newDelhi: 'Inhouse', runDay: 'Tue, Friday' },
  { skuId: '2176', doseCode: 'LFSBI29GUR', testName: 'Arsenic, Spot Urine', newDelhi: 'Outsource', runDay: 'Batch decided as per sample load' },
  { skuId: '2319', doseCode: 'LFSBI140GUR', testName: 'Opiates', newDelhi: 'Inhouse', runDay: 'Daily' }
];
