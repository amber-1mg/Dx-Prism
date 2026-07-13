/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity,
  FileText,
  Lightbulb,
  Stethoscope,
  Menu, 
  Search, 
  CheckCircle2, 
  Info, 
  LayoutGrid, 
  Library, 
  UserCircle2,
  Syringe,
  Users2,
  Baby,
  TableProperties,
  ChevronDown,
  Heart,
  Microscope,
  HelpCircle,
  Check,
  X,
  Bug,
  Droplets,
  Filter,
  Apple,
  Shield,
  Dna,
  Layers,
  Focus,
  MessageSquare,
  Send,
  Trophy,
  Star,
  Zap,
  History,
  Mic,
  MicOff,
  ChevronRight,
  User,
  DownloadCloud,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db, auth, signInWithGoogle, getAccessToken } from './lib/firebase';
import { TEST_KNOWLEDGE_BASE } from './constants/testData';
import { SPECIALIZED_TESTS_KNOWLEDGE } from './constants/specializedTests';
import { fetchReportsFromDrive, DriveFile } from './services/driveService';
import { NrlOkhlaSection } from './components/NrlOkhlaSection';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp,
  getDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Types ---
interface TestDetail {
  name: string;
  indications: string;
  contraindications?: string;
  link?: string;
  isOutsourced?: boolean;
}

interface Methodology {
  name: string;
  characteristics: string;
  results: string;
  advantages: string;
  challenges: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanations: string[];
}

interface Segment {
  id: string;
  title: string;
  icon: React.ReactNode;
  image: string;
  description: string;
  clinicalUtility: string;
  clinicalInsight: string;
  testsCovered: TestDetail[];
  accentColor: string; // Tailwind text color
  bgColor: string;     // Tailwind background color
  methodologies?: Methodology[];
  quiz: QuizQuestion;
}

interface RecentlyViewedItem {
  id: string;
  title: string;
  type: 'segment' | 'test';
  timestamp: number;
}

const RecentlyViewed = ({ 
  items, 
  onItemClick 
}: { 
  items: RecentlyViewedItem[]; 
  onItemClick: (item: RecentlyViewedItem) => void;
}) => {
  if (items.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-gray-400" />
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recently Interacted</h4>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {items.map((item) => (
          <motion.button
            key={`${item.type}-${item.id}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onItemClick(item)}
            className="flex-shrink-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3 min-w-[200px]"
          >
            <div className={`p-2 rounded-xl ${item.type === 'segment' ? 'bg-[#ff6f61]/10 text-[#ff6f61]' : 'bg-blue-50 text-blue-600'}`}>
              {item.type === 'segment' ? <LayoutGrid className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight truncate">{item.type}</p>
              <h5 className="text-xs font-bold text-gray-900 truncate">{item.title}</h5>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// --- Constants ---
const SEGMENTS: Segment[] = [
  {
    id: 'allergy',
    title: 'Allergy',
    icon: <Syringe className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://asthmaallergyclinic.in/wp-content/uploads/2023/02/0002c1431e73be4aeca346283beff011.jpg',
    description: 'Specialized immunological assessment of hypersensitivity reactions. Allergy happens when the immune system overreacts to harmless substances, triggering inflammatory responses and IgE production.',
    clinicalUtility: 'Aids in distinguishing true allergies from cross-reactives, specifically using molecular precision to prevent anaphylaxis and guide long-term immunotherapy.',
    clinicalInsight: 'Component-Resolved Diagnostics (CRD) helps pinpoint exact proteins, distinguishing between a dangerous nut allergy and harmless birch pollen cross-reactivity.',
    testsCovered: [
      {
        name: 'Phadiatop',
        indications: 'Gold standard screening for common environmental allergens; differentiates atopic from non-atopic symptoms.',
        link: 'https://www.1mg.com/labs/test/36952'
      },
      {
        name: 'Comprehensive Allergy Panels (with CRD)',
        indications: 'Advanced diagnostic including Component-Resolved Diagnostics to identify specific molecular triggers (e.g., Ara h 1 vs Ara h 8 in peanuts).',
        link: 'https://www.1mg.com/labs/test/35433'
      },
      {
        name: 'Total IgE',
        indications: 'General marker of allergic sensitization or parasitic infection; helps establish the baseline for allergic predisposition.',
        link: 'https://www.1mg.com/labs/test/1952'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'According to the comparison table, which methodology is considered the "Gold Standard" for allergy testing?',
      options: ['ELISA', 'LIA', 'ImmunoCAP', 'CRD'],
      correctAnswer: 2,
      explanations: [
        'Incorrect. ELISA has low sensitivity and specificity compared to modern methods.',
        'Incorrect. LIA is broad and cost-effective but not the qualitative gold standard.',
        'Correct! ImmunoCAP is globally recognized as the gold standard for quantitative allergy testing.',
        'Incorrect. CRD is higher precision molecular testing, but ImmunoCAP remains the clinical gold standard for screening.'
      ]
    },
    methodologies: [
      {
        name: 'ELISA',
        characteristics: 'Initial screening test. Have very low sensitivity & specificity.',
        results: 'Semi-quantitative',
        advantages: 'Cost Effective',
        challenges: 'Very low sensitivity, specificity and accuracy of test results.'
      },
      {
        name: 'LIA',
        characteristics: '107 different allergens in a single panel. Broad screening.',
        results: 'Semi-quantitative',
        advantages: 'Cost-effective compared to ImmunoCAP, better sensitivity than ELISA.',
        challenges: 'Market penetration challenge.'
      },
      {
        name: 'ImmunoCAP',
        characteristics: 'Gold Standard for Allergy Testing.',
        results: 'Quantitative',
        advantages: 'Confirmatory testing, guides immunotherapy decisions.',
        challenges: 'High cost.'
      },
      {
        name: 'CRD',
        characteristics: 'Personalized allergy diagnosis, distinguishes true vs. cross-reactive.',
        results: 'Quantitative (Molecular Precision)',
        advantages: 'Precision diagnostics for personalized treatment.',
        challenges: 'Very high cost.'
      }
    ]
  },
  {
    id: 'reproductive',
    title: 'Reproductive Health',
    icon: <Users2 className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=2070&auto=format&fit=crop',
    description: 'An end-to-end diagnostic suite covering fertility assessment, prenatal screening, and postnatal care. This segment integrates biochemical assays with advanced molecular genetics to ensure healthy outcomes for both mother and child.',
    clinicalUtility: 'Enables early detection of chromosomal abnormalities via non-invasive methods, guides IVF protocols through hormonal profiling, and manages high-risk pregnancies with precision monitoring.',
    clinicalInsight: 'AMH levels are remarkably stable across the menstrual cycle, making it the most reliable biomarker for assessing ovarian reserve regardless of the test date.',
    testsCovered: [
      {
        name: 'FSH, LH & Prolactin',
        indications: 'Essential for evaluating common hormonal imbalances, menstrual irregularities, and reproductive health status.',
        link: 'https://www.1mg.com/labs/test/2321'
      },
      {
        name: 'AMH',
        indications: 'Accurate biomarker for assessing ovarian reserve and predicting outcomes for assisted reproductive technologies (ART).',
        link: 'https://www.1mg.com/labs/test/1670'
      },
      {
        name: 'Hcg Beta Total',
        indications: 'The primary marker for establishing pregnancy and monitoring potential early complications like ectopic pregnancy.',
        link: 'https://www.1mg.com/labs/test/2540'
      },
      {
        name: 'Dual Marker',
        indications: 'First-trimester screening for chromosomal abnormalities like Down Syndrome and Trisomy 18.',
        link: 'https://www.1mg.com/labs/test/2185'
      },
      {
        name: 'Triple Marker',
        indications: 'Second-trimester screening providing insights into chromosomal risks and neural tube defects.',
        link: 'https://www.1mg.com/labs/test/2186'
      },
      {
        name: 'Quadruple Marker',
        indications: 'Comprehensive second-trimester screen with higher sensitivity for trisomy 21 and overall fetal health.',
        link: 'https://www.1mg.com/labs/test/2111'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'Which test is primarily used for the evaluation of ovarian reserve and prediction of ART outcomes?',
      options: ['FSH, LH, Prolactin', 'AMH (Anti-Mullerian Hormone)', 'Dual/Triple Markers', 'HCG Beta Total'],
      correctAnswer: 1,
      explanations: [
        'Incorrect. These assess general hormonal balance and pituitary function.',
        'Correct! AMH is the key marker for assessing ovarian reserve and predicting IVF success.',
        'Incorrect. These are prenatal screening tests for chromosomal abnormalities.',
        'Incorrect. HCG is primarily used for pregnancy confirmation and monitoring.'
      ]
    }
  },
  {
    id: 'pediatrics',
    title: 'Pediatrics',
    icon: <Baby className="w-8 h-8 text-[#b41d15]" />,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB041QAjJRA6jBTc7j7iGNJYDvAz1j3tJzBZs04XCNS-ntiUxJAB_nCcFREgayF7wGWQRuY2WOPANYqV8jPb8o6iv-zR0fHH1sPUYU6p6-7vnDJUo6dufwHrnKLOqu2MbPJ5oniNq9wVcljM14aplfNbf28EJWAPP18R3ISPivvXIzF1_b2ZK8p7vZ3miq4wRw4a-FuHk8KS2LWuzhFAEPwAMb7-84dG4-8fbIF-oVkN7T-WszfDtiFR17Xa85OyqHqq0fcCWnnXsAW',
    description: 'Specialized testing designed for the unique physiological needs of infants and children. Focusing on developmental milestones, nutritional deficiencies, and screening for congenital metabolic disorders.',
    clinicalUtility: 'Critical for preventing irreversible damage from metabolic errors through Newborn Screening. Facilitates early intervention for developmental delays by monitoring micronutrient and hormonal balance.',
    clinicalInsight: 'Newborn screening for 17-OHP can be life-saving, allowing for immediate intervention in Congenital Adrenal Hyperplasia before a metabolic crisis occurs.',
    testsCovered: [
      {
        name: 'Allergy- Asthma / Rhinitis Comprehensive Panel',
        indications: 'Molecular-level screening for common childhood environmental and food allergens.',
        link: 'https://www.1mg.com/labs/test/35247'
      },
      {
        name: 'Allergy - Wheeze / Rhinitis Panel',
        indications: 'Specialized testing for pediatric patients suffering from chronic respiratory symptoms.',
        link: 'https://www.1mg.com/labs/test/36982'
      },
      {
        name: 'Allergy Dust Mite Panel',
        indications: 'Highly sensitive detection of dust mite sensitivity, a leading cause of childhood asthma.',
        link: 'https://www.1mg.com/labs/test/38818'
      }
    ],
    accentColor: 'text-[#b41d15]',
    bgColor: 'bg-[#b41d15]',
    quiz: {
      question: 'Newborn Screening is critical for preventing irreversible damage from which of the following?',
      options: ['Nutritional deficiencies', 'Developmental delays', 'Congenital metabolic errors', 'Hormonal imbalances'],
      correctAnswer: 2,
      explanations: [
        'Incorrect. While important, it specifically targets metabolic errors that need immediate intervention.',
        'Incorrect. Developmental delays are often a consequence, but the direct target is the underlying error.',
        'Correct! Early detection of metabolic errors like G6PD or 17-OHP prevents permanent damage.',
        'Incorrect. TSH is a hormone, but the broad scope is metabolic/endocrine congenital errors.'
      ]
    }
  },
  {
    id: 'cardiology',
    title: 'Cardiology',
    icon: <Heart className="w-8 h-8 text-[#15803d]" />,
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?q=80&w=2070&auto=format&fit=crop',
    description: 'Advanced assessment of cardiovascular health through high-sensitivity biomarkers. This segment enables precise risk stratification for coronary artery disease, heart failure, and acute coronary syndromes.',
    clinicalUtility: 'Vital for differentiating cardiac vs. non-cardiac chest pain, monitoring chronic heart failure progression, and identifying asymptomatic individuals at high risk for major adverse cardiac events (MACE).',
    clinicalInsight: 'High-sensitivity Troponin-I can detect cardiac muscle damage at concentrations 10-100 times lower than conventional assays, accelerating MI Rule-In/Rule-Out protocols.',
    testsCovered: [
      {
        name: 'Lipid Profile',
        indications: 'Essential screening for heart health by evaluating good and bad cholesterol levels.',
        link: 'https://www.1mg.com/labs/test/1909'
      },
      {
        name: 'Extended Lipid Profile',
        indications: 'More granular analysis including VLDL and critical cardiovascular ratios.',
        link: 'https://www.1mg.com/labs/test/1334'
      },
      {
        name: 'NT Pro-BNP',
        indications: 'Highly specific marker for cardiac wall stress; diagnostic and prognostic for heart failure.',
        link: 'https://www.1mg.com/labs/test/1548'
      },
      {
        name: 'High Sensitive Troponin-I',
        indications: 'The gold standard for identifying minute amounts of cardiac muscle injury indicative of heart attack.',
        link: 'https://www.1mg.com/labs/test/35155'
      },
      {
        name: 'Advanced Cardiac Risk Markers',
        indications: 'Assesses inflammatory and molecular risk factors like hs-CRP and Homocysteine.',
        link: 'https://www.1mg.com/labs/test/34953'
      },
      {
        name: 'Apolipoprotein - A1',
        indications: 'Quantitative measure of the primary protein component of HDL for advanced CV risk assessment.',
        link: 'https://www.1mg.com/labs/test/2275'
      },
      {
        name: 'Lipoprotein (a)',
        indications: 'Genetic cardiovascular risk marker that independent of standard cholesterol levels.',
        link: 'https://www.1mg.com/labs/test/2235'
      }
    ],
    accentColor: 'text-[#15803d]',
    bgColor: 'bg-[#15803d]',
    quiz: {
      question: 'Which biomarker is considered the "Gold Standard" for early detection of myocardial infarction?',
      options: ['NT-proBNP', 'hs-Troponin I/T', 'Lp-PLA2', 'Homocysteine'],
      correctAnswer: 1,
      explanations: [
        'Incorrect. This is primarily a marker for heart failure and ventricular dysfunction.',
        'Correct! High-sensitivity Troponin is the definitive marker for acute myocardial infarction.',
        'Incorrect. Lp-PLA2 is for plaque rupture risk assessment, not acute MI detection.',
        'Incorrect. This is an independent risk factor for stroke and chronic disease.'
      ]
    }
  },
  {
    id: 'metabolic',
    title: 'Metabolic & Diabetes',
    icon: <Activity className="w-8 h-8 text-[#0891b2]" />,
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
    description: 'Comprehensive metabolic screening focusing on glycemic control, insulin resistance, and pancreatic function. Essential for managing Diabetes mellitus and metabolic syndrome.',
    clinicalUtility: 'Provides quantitative insights into long-term blood sugar stability and early indicators of pancreatic beta-cell dysfunction, enabling early intervention and personalized lifestyle management.',
    clinicalInsight: 'HbA1c provides a weighted average of blood sugar over 90 days; however, recent changes in the last 30 days contribute roughly 50% to the overall value.',
    testsCovered: [
      {
        name: 'Glycosylated Hemoglobin (HbA1c)',
        indications: 'Gold standard for monitoring average blood sugar over 3 months.',
        link: 'https://www.1mg.com/labs/test/1611'
      },
      {
        name: 'HOMA IR',
        indications: 'Biochemical calculation to identify hidden insulin resistance before sugar levels peak.',
        link: 'https://www.1mg.com/labs/test/35080'
      },
      {
        name: 'Glucose Fasting',
        indications: 'Standard initial measurement of baseline glycemic status after an overnight fast.',
        link: 'https://www.1mg.com/labs/test/1783'
      },
      {
        name: 'Glucose Challenge Test 50g',
        indications: 'Commonly used in pregnancy to screen for gestational diabetes risk.',
        link: 'https://www.1mg.com/labs/test/1588'
      }
    ],
    accentColor: 'text-[#0891b2]',
    bgColor: 'bg-[#0891b2]',
    quiz: {
      question: 'What is the primary clinical advantage of HbA1c over a standard Fasting Glucose test?',
      options: [
        'It is cheaper to perform',
        'It reflects average glucose levels over 8-12 weeks',
        'It identifies immediate spikes in sugar',
        'It measures liver function'
      ],
      correctAnswer: 1,
      explanations: [
        'Incorrect. Cost is not the primary clinical advantage.',
        'Correct! HbA1c provides an index of long-term fluctuations rather than a single point in time.',
        'Incorrect. Post-prandial or continuous monitoring is better for immediate spikes.',
        'Incorrect. HbA1c is a marker of glycemic control, not liver function.'
      ]
    }
  },
  {
    id: 'infectious',
    title: 'Infectious Diseases',
    icon: <Bug className="w-8 h-8 text-[#7c3aed]" />,
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=2070&auto=format&fit=crop',
    description: 'Specialized screening and confirmation of viral, bacterial, and parasitic infections including Fever, Hepatitis, and HIV.',
    clinicalUtility: 'Enables rapid identification of pathogens during acute febrile episodes and monitors chronic viral loads to guide specialized therapy.',
    clinicalInsight: 'Dengue NS1 Antigen is detectable before the development of antibodies, making it the primary diagnostic choice during the first 5 days of acute fever.',
    testsCovered: [
      {
        name: 'Dengue NS1 Antigen',
        indications: 'Highly sensitive detection of the non-structural protein of the dengue virus during the early acute phase.',
        link: 'https://www.1mg.com/labs/test/1473'
      },
      {
        name: 'Malarial Antigen (Vivax & Falciparum)',
        indications: 'Rapid immunochromatographic assay for the qualitative detection of Plasmodium antigens.',
        link: 'https://www.1mg.com/labs/test/1874'
      },
      {
        name: 'HIV Combo (Antigen And Antibody)',
        indications: 'Simultaneous detection of HIV p24 antigen and antibodies for the earliest possible diagnosis of infection.',
        link: 'https://www.1mg.com/labs/test/2273'
      },
      {
        name: 'Hepatitis Viral Load (PCR)',
        indications: 'Real-time PCR quantification of viral DNA/RNA to assess infectivity and response to treatment.',
        link: 'https://www.1mg.com/labs/test/2051'
      }
    ],
    accentColor: 'text-[#7c3aed]',
    bgColor: 'bg-[#7c3aed]',
    quiz: {
      question: 'Within what time frame during fever onset is the Dengue NS1 Antigen test most effective?',
      options: ['After 14 days', 'Only after fever subsides', 'From 1st day to 5th day', 'Only in the 3rd week'],
      correctAnswer: 2,
      explanations: [
        'Incorrect. IgG antibodies are used for late detection.',
        'Incorrect. The antigen is present during the early active phase.',
        'Correct! NS1 is detectable from the very first day of fever up to day 5.',
        'Incorrect. By the 3rd week, the antigen is usually cleared and antibodies are present.'
      ]
    }
  },
  {
    id: 'liver',
    title: 'Liver & Digestive',
    icon: <Droplets className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP-pOl0CY6CAV2QSKoeqzRUcaNb0607vCPmw&s',
    description: 'Assessment of hepatic health and digestive function through enzymatic analysis, specialized autoimmune markers, and gut microbiome profiling.',
    clinicalUtility: 'Vital for screening liver damage from medication, alcohol, or infection; and identifying malabsorption syndromes like Celiac disease.',
    clinicalInsight: 'ALT is significantly more specific to the liver than AST, which is also distributed in high concentrations in heart, muscle, and even red blood cells.',
    testsCovered: [
      {
        name: 'LFT (Liver Function Test)',
        indications: 'Panel comprising Bilirubin, ALT (SGPT), AST (SGOT), and GGT to assess liver activity.',
        link: 'https://www.1mg.com/labs/test/2562'
      },
      {
        name: 'Gut Microbiome',
        indications: 'Advanced mapping of intestinal flora to assess digestive diversity, metabolic health, and potential inflammation risks.',
        link: 'https://www.1mg.com/labs/test/37788'
      },
      {
        name: 'tTG Antibody (IgG/IgA)',
        indications: 'Key marker for diagnosing Celiac disease and monitoring adherence to a gluten-free diet.',
        link: 'https://www.1mg.com/labs/test/1621'
      },
      {
        name: 'H. Pylori Antigen',
        indications: 'Detection of bacterium linked to duodenal and gastric ulcers and chronic gastritis.',
        link: 'https://www.1mg.com/labs/test/1669'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'Which enzyme is considered more specific to liver tissue damage than skeletal muscle?',
      options: ['AST (SGOT)', 'ALT (SGPT)', 'Amylase', 'CPK'],
      correctAnswer: 1,
      explanations: [
        'Incorrect. AST is found in liver but significantly in heart and muscle too.',
        'Correct! ALT is found mainly in liver tissue, making it a more specific marker for hepatic injury.',
        'Incorrect. Amylase is a marker for pancreatic function.',
        'Incorrect. CPK is a marker for muscle/heart damage.'
      ]
    }
  },
  {
    id: 'kidney',
    title: 'Kidney Care',
    icon: <Filter className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://www.shutterstock.com/image-illustration/anatomy-human-kidney-cross-section-260nw-2548564981.jpg',
    
    // CLEANED_UP_IMAGE_PROPERTY
    description: 'In-depth evaluation of renal function, electrolyte balance, and early indicators of chronic kidney disease (CKD).',
    clinicalUtility: 'Crucial for monitoring patients with hypertension and diabetes, managing electrolyte imbalances, and detecting early-stage renal impairment.',
    clinicalInsight: 'Microalbuminuria is the earliest clinical sign of diabetic nephropathy, often appearing years before any significant change in serum creatinine or eGFR.',
    testsCovered: [
      {
        name: 'KFT (Kidney Function Test)',
        indications: 'Assesses BUN, Urea, and Creatinine levels to screen for risk factors like family history or hypertension.'
      },
      {
        name: 'eGFR (estimated GFR)',
        indications: 'Best measure of overall kidney function; calculation based on creatinine, age, and gender.'
      },
      {
        name: 'Microalbumin Random',
        indications: 'One of the earliest indicators of kidney damage, especially in diabetic nephropathy.'
      },
      {
        name: 'Serum Electrolytes',
        indications: 'Measures Sodium, Potassium, and Chloride; essential for assessing acid-base balance.'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'What is the role of eGFR in diagnosing kidney disease?',
      options: [
        'It measures blood pressure',
        'It counts red blood cells in urine',
        'It is the best measure of overall kidney function',
        'It detects kidney stones'
      ],
      correctAnswer: 2,
      explanations: [
        'Incorrect. eGFR is a biological calculation, not a BP measurement.',
        'Incorrect. That is part of urine microscopy.',
        'Correct! eGFR is the level accepted as the best measure of overall kidney function in health and disease.',
        'Incorrect. Imaging or stone analysis is used for stones.'
      ]
    }
  },
  {
    id: 'nutrition',
    title: 'Nutritional Health',
    icon: <Apple className="w-8 h-8 text-[#d97706]" />,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2070&auto=format&fit=crop',
    description: 'Screening for essential vitamins and minerals to identify deficiencies linked to fatigue, nerve health, and bone metabolism.',
    clinicalUtility: 'Enables precise supplementation and dietary adjustments to prevent serious conditions like Megaloblastic anemia and Osteoporosis.',
    clinicalInsight: 'Vitamin B12 absorption requires "Intrinsic Factor" from the stomach; deficiency is common in individuals on long-term acid-suppressants or post-gastric surgery.',
    testsCovered: [
      {
        name: 'Vitamin B12',
        indications: 'Essential for nerve health and blood cell formation; deficiency causes fatigue and neuropathy.'
      },
      {
        name: 'Vitamin D (25-OH)',
        indications: 'Key for bone health and calcium absorption; highly impacted by modern indoor lifestyles.'
      },
      {
        name: 'Iron Studies (Basic/Comp)',
        indications: 'Essential for diagnosing types of anemia; differentiates iron deficiency from chronic disease.'
      },
      {
        name: 'Vitamin B9 (Folate)',
        indications: 'Critical for cell division; deficiency leads to Megaloblastic and Macrocytic anemias.'
      }
    ],
    accentColor: 'text-[#d97706]',
    bgColor: 'bg-[#d97706]',
    quiz: {
      question: 'Deficiency in which of these vitamins is a common cause of Megaloblastic anemia?',
      options: ['Vitamin C', 'Vitamin D', 'Vitamin B9 (Folate)', 'Vitamin E'],
      correctAnswer: 2,
      explanations: [
        'Incorrect. Vitamin C deficiency causes Scurvy.',
        'Incorrect. Vitamin D deficiency affects bone health (Rickets/Osteomalacia).',
        'Correct! Folate (B9) deficiency is a primary cause of Megaloblastic and Macrocytic anemias.',
        'Incorrect. Vitamin E affects nerve and cell membrane health.'
      ]
    }
  },
  {
    id: 'autoimmune',
    title: 'Autoimmune Health',
    icon: <Shield className="w-8 h-8 text-[#db2777]" />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuus8MDEf-N9wYW3rmLAz0qAia2OFFYyzVSw&s',
    description: 'Advanced serological detection of autoantibodies for the diagnosis and management of rheumatologic and connective tissue disorders.',
    clinicalUtility: 'Enables multi-layered risk evaluation for complex disorders like SLE and Rheumatoid Arthritis, guiding long-term immunosuppressive therapy.',
    clinicalInsight: 'A negative ANA by IFA has a high negative predictive value (approx. 95%), making it an excellent rule-out test for Systemic Lupus Erythematosus (SLE).',
    testsCovered: [
      {
        name: 'ANA (Anti-Nuclear Antibody) by IFA',
        indications: 'The first-line screening test for systemic autoimmune diseases like SLE and Scleroderma.',
        link: 'https://www.1mg.com/labs/test/2164'
      },
      {
        name: 'Anti-CCP (Cyclic Citrullinated Peptide)',
        indications: 'Highly specific early marker for Rheumatoid Arthritis with significant prognostic value.',
        link: 'https://www.1mg.com/labs/test/2170'
      },
      {
        name: 'Anti-dsDNA Antibody',
        indications: 'Specific confirmatory marker for Systemic Lupus Erythematosus (SLE) activity.',
        link: 'https://www.1mg.com/labs/test/37857'
      },
      {
        name: 'tTG Antibody (IgG/IgA)',
        indications: 'Primary markers for diagnosing Celiac disease and monitoring gluten-free diet compliance.',
        link: 'https://www.1mg.com/labs/test/1621'
      }
    ],
    accentColor: 'text-[#db2777]',
    bgColor: 'bg-[#db2777]',
    quiz: {
      question: 'Which of these autoantibodies is considered a "marker antibody" highly specific for SLE?',
      options: ['Rheumatoid Factor', 'Anti-CCP', 'Anti ds-DNA', 'ASO Titer'],
      correctAnswer: 2,
      explanations: [
        'Incorrect. RF is for Rheumatoid Arthritis.',
        'Incorrect. Anti-CCP is specific to Rheumatoid Arthritis.',
        'Correct! ds-DNA Antibody is highly specific for Systemic Lupus Erythematosus (SLE).',
        'Incorrect. ASO Titer confirms exposure to Streptococcus.'
      ]
    }
  },
  {
    id: 'oncology',
    title: 'Oncology',
    icon: <Microscope className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKFaQoDtwmj7Px3kAN4yssziC4z9x3zqAdTQ&s',
    description: 'Specialized tumor markers and liquid biopsy options for early detection, therapeutic monitoring, and recurrence surveillance across various cancer types.',
    clinicalUtility: 'Facilitates non-invasive monitoring of treatment efficacy, enabling "on-the-fly" therapy adjustments and early detection of molecular relapse before clinical symptoms or radiological evidence appear.',
    clinicalInsight: 'Tumor markers like CEA and CA-125 are most effective when used for surveillance; a rising trend is often more clinically significant than a single high value.',
    testsCovered: [
      {
        name: 'CA-125',
        indications: 'Highly specific tumor marker for ovarian cancer; used for evaluating therapy response and early detection of recurrence.',
        link: 'https://www.1mg.com/labs/test/1543'
      },
      {
        name: 'PSA (Total & Free)',
        indications: 'Key marker for prostate health; monitoring the ratio helps differentiate between benign and malignant conditions.',
        link: 'https://www.1mg.com/labs/test/1994'
      },
      {
        name: 'CEA (Carcinoembryonic Antigen)',
        indications: 'Broad-spectrum marker for GI and colorectal cancers; also slightly elevated in smokers.',
        link: 'https://www.1mg.com/labs/test/2180'
      },
      {
        name: 'AFP',
        indications: 'Vital for monitoring hepatocellular carcinoma and certain germ-cell tumors of the ovary and testes.',
        link: 'https://www.1mg.com/labs/test/2236'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'Which specialized tumor marker is used for monitoring response to therapy in cases of ovarian cancer?',
      options: ['CA-125', 'PSA (Total & Free)', 'CEA', 'AFP'],
      correctAnswer: 0,
      explanations: [
        'Correct! CA-125 is the standard marker for monitoring ovarian cancer treatment.',
        'Incorrect. PSA is specific to prostate adenocarcinoma.',
        'Incorrect. CEA is a broad marker for colorectal and GI cancers.',
        'Incorrect. AFP is for liver or germ cell tumors.'
      ]
    }
  },
  {
    id: 'hematology',
    title: 'Hemato-oncology',
    icon: <Droplets className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://thumbnails.icloudhospital.com/tr:w-1024,f-webp,q-75/1-hematology-oncology-6486c0e0-b6c2-4d16-8405-f8ef69996546.webp',
    description: 'Specialized evaluation of hematological malignancies, including Leukemias, Lymphomas, and Myelomas. This segment uses Flow Cytometry, FISH, and PCR for precise lineage identification and risk stratification.',
    clinicalUtility: 'Critical for establishing baseline molecular status, monitoring Minimal Residual Disease (MRD), and identifying high-risk clones like the Philadelphia chromosome that require targeted TKI therapy.',
    clinicalInsight: 'BCR-ABL1 monitoring on the International Scale (IS) is critical for adjusting TKI dosage to achieve Major Molecular Response (MMR) in CML patients.',
    testsCovered: [
      {
        name: 'BCR-ABL Quantitative PCR (IS Scale)',
        indications: 'Precise monitoring of CML monitoring on International Scale (IS) for therapy response.',
        link: 'https://www.1mg.com/labs/test/1989',
        isOutsourced: false
      },
      {
        name: 'CLL Prognostic Panel',
        indications: 'FISH-based multi-marker panel to predict aggressiveness and plan therapy in CLL.',
        link: 'https://www.1mg.com/labs/test/36575',
        isOutsourced: true
      },
      {
        name: 'AML Multiplex Basic Panel',
        indications: 'PCR screening for common driver mutations to refine Myeloid Leukemia subtypes.',
        link: 'https://www.1mg.com/labs/test/35334',
        isOutsourced: true
      },
      {
        name: 'AML ETO t(8;21), Quantitative',
        indications: 'Targeted quantification of ETO fusions for patients in the AML M2 subgroup.',
        link: 'https://www.1mg.com/labs/test/36496',
        isOutsourced: true
      },
      {
        name: 'PML/RARA - t(15;17) Qualitative',
        indications: 'Confirmatory test for Acute Promyelocytic Leukemia (APL), enabling emergency therapy.',
        link: 'https://www.1mg.com/labs/test/2094',
        isOutsourced: true
      },
      {
        name: 'ALL Multiplex Basic Panel',
        indications: 'Screening for E2A-PBX1 and other common translocations in lymphoid leukemia.',
        link: 'https://www.1mg.com/labs/test/35326',
        isOutsourced: true
      },
      {
        name: 'AML Panel with MLL by FISH',
        indications: 'Comprehensive FISH panel targeting MLL rearrangements and large structural changes.',
        link: 'https://www.1mg.com/labs/test/35337',
        isOutsourced: true
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'Which genetic abnormality is specifically associated with the "Double-Hit" classification in aggressive B-cell Lymphomas?',
      options: [
        'BCR-ABL fusion',
        'JAK2 V617F mutation',
        'Co-occurrence of MYC and BCL2/BCL6 rearrangements',
        '17p deletion'
      ],
      correctAnswer: 2,
      explanations: [
        'Incorrect. BCR-ABL is the hallmark of CML and Ph+ ALL.',
        'Incorrect. JAK2 is primarily associated with MPNs like Polycythemia Vera.',
        'Correct! Double-hit lymphomas are aggressive B-cell malignancies defined by rearrangements in MYC plus BCL2 and/or BCL6.',
        'Incorrect. 17p deletion (TP53) is a general high-risk marker but not the definition of "Double-Hit".'
      ]
    }
  },
  {
    id: 'genetics',
    title: 'Genetics & Hereditary Risk',
    icon: <Dna className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?q=80&w=2070&auto=format&fit=crop',
    description: 'Investigating germline mutations predisposing individuals to hereditary cancer syndromes and rare genetic disorders. Focuses on family-wide risk assessment and proactive health management.',
    clinicalUtility: 'Identifies individuals at high lifetime risk for malignancy (e.g., HBOC, Lynch Syndrome), enabling intensified surveillance, prophylactic surgical options, and specialized reproductive counseling.',
    clinicalInsight: 'Genetic testing for BRCA1/2 and Lynch syndrome provides actionable insights for family members, often shifting focus from treatment to early prevention.',
    testsCovered: [
      {
        name: 'Hereditary Cancer Gene Panel',
        indications: 'Multigene NGS search for germline mutations linked to inherited cancer syndromes.',
        link: 'https://www.1mg.com/labs/test/35255',
        isOutsourced: true
      },
      {
        name: 'Comp. Hereditary Cancer Panel',
        indications: 'Includes analysis of SNVs, Small INDELs, and CNVs for the most comprehensive inherited risk view.',
        link: 'https://www.1mg.com/labs/test/35257',
        isOutsourced: true
      },
      {
        name: 'geneCORE Predict (Basic/Adv)',
        indications: 'Specialized screening targeting multi-cancer susceptibility sets (HBOC, Lynch, etc.).',
        link: 'https://www.1mg.com/labs/test/35243',
        isOutsourced: true
      },
      {
        name: 'Matchmygenome',
        indications: 'Comprehensive couple carrier screening on whole exome for healthy preconception planning.',
        link: 'https://www.1mg.com/labs/test/38556',
        isOutsourced: true
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'What is the primary objective of "Carrier Screening" for couples?',
      options: [
        'To identify active infections in the parents',
        'To detect recessive mutations that could lead to a 1-in-4 chance of an affected baby',
        'To determine the biological age of the parents',
        'To screen for high blood pressure risk'
      ],
      correctAnswer: 1,
      explanations: [
        'Incorrect. That would be infectious disease screening.',
        'Correct! If both parents are carriers of the same recessive disease, there is a 25% risk for an affected child in each pregnancy.',
        'Incorrect. Epigenetic methylation tests are used for biological age.',
        'Incorrect. That is a complex trait, usually covered in PRS tests like HyperSense.'
      ]
    }
  },
  {
    id: 'precision_oncology',
    title: 'Advance Genomics',
    icon: <Layers className="w-8 h-8 text-[#ff6f61]" />,
    image: 'https://www.mdanderson.org/content/mda/en/research/research-resources/core-facilities/advanced-technology-genomics-core/jcr:content/heroparsys/herodescription/lvpimage.resize.2800.568.high.jpg/1774282867089.jpg',
    description: 'Comprehensive Genomic Profiling (CGP) that examines hundreds of cancer-related genes simultaneously to identify targetable mutations, fusions, and multi-gene biomarkers.',
    clinicalUtility: 'Directly informs the selection of immunotherapy and targeted therapy. Evaluates complex scars like TMB and MSI which are tissue-agnostic indicators of immune-checkpoint inhibitor efficacy.',
    clinicalInsight: 'Tumor Mutational Burden (TMB) identifies tumors with high "foreignness" to the immune system, serving as a key biomarker for Pembrolizumab efficacy.',
    testsCovered: [
      {
        name: 'Microsatellite Instability (MSI)',
        indications: 'Fragment analysis to detect replication errors; strong predictor for positive response to immunotherapy.',
        link: 'https://www.1mg.com/labs/test/36452'
      },
      {
        name: 'Tumor Mutational Burden (TMB)',
        indications: 'Evaluates the total workload of somatic mutations; higher scores correlate with better immune-checkpoint efficacy.',
        link: 'https://www.1mg.com/labs/test/37728'
      },
      {
        name: 'HRDTrack Test',
        indications: 'State-of-the-art assessment of genomic stability to determine eligibility for PARP inhibitors.',
        link: 'https://www.1mg.com/labs/test/36459'
      }
    ],
    accentColor: 'text-[#ff6f61]',
    bgColor: 'bg-[#ff6f61]',
    quiz: {
      question: 'Why is TMB (Tumor Mutational Burden) an important biomarker for Immunotherapy?',
      options: [
        'It measures the size of the tumor',
        'It identifies the organ where the cancer started',
        'More mutations indicate more neoantigens that can activate the immune system',
        'It identifies the effectiveness of standard chemotherapy'
      ],
      correctAnswer: 2,
      explanations: [
        'Incorrect. Tumor size is measured by radiology.',
        'Incorrect. TMB is a molecular feature, often tissue-agnostic.',
        'Correct! A high mutation count suggests the tumor looks "stranger" to the immune system, improving the efficacy of checkpoint inhibitors.',
        'Incorrect. TMB specifically helps predict immunotherapy response, not standard chemo.'
      ]
    }
  },
  {
    id: 'pathology',
    title: 'Specialized Pathology',
    icon: <Focus className="w-8 h-8 text-[#4338ca]" />,
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2070&auto=format&fit=crop',
    description: 'Expert histological and immunohistochemical review of tissue specimens. Providing confirmatory diagnoses and specialized sub-typing of complex tumors.',
    clinicalUtility: 'Ensures diagnostic accuracy through radical specimen review and second opinions. Vital for definitive cancer staging and identifying protein targets for targeted medicine.',
    clinicalInsight: 'PD-L1 expression scoring (TPS/CPS) is essential for selecting patients for immune checkpoint inhibitors across multiple solid tumor indications.',
    testsCovered: [
      {
        name: 'PDL-1 SP263 Ventana',
        indications: 'High-precision IHC clone used to evaluate eligibility for standard-of-care immunotherapy.',
        link: 'https://www.1mg.com/labs/test/36174'
      },
      {
        name: 'PDL-1 22C3 Dako',
        indications: 'Companion diagnostic IHC for Pembrolizumab, specifically in Lung and Head/Neck cancers.',
        link: 'https://www.1mg.com/labs/test/36168'
      },
      {
        name: 'MMR Panel (MLH1, MSH2, MSH6 & PMS2)',
        indications: 'Four-marker protein panel to identify mismatch repair deficiency and Lynch Syndrome risk.',
        link: 'https://www.1mg.com/labs/test/36187'
      },
      {
        name: 'Review - Histopath (Biopsy/Resection)',
        indications: 'Expert re-evaluation of pathological specimens to confirm and refine difficult diagnoses.',
        link: 'https://www.1mg.com/labs/test/40600'
      }
    ],
    accentColor: 'text-[#4338ca]',
    bgColor: 'bg-[#4338ca]',
    quiz: {
      question: 'In which scenario is a "Second Opinion" pathological review most highly recommended?',
      options: [
        'For routine annual health checkups',
        'When the initial diagnosis is unambiguous',
        'In rare conditions, ambiguous biopsies, or before major life-altering surgery',
        'For basic blood count abnormalities'
      ],
      correctAnswer: 2,
      explanations: [
        'Incorrect. Annual checkups rarely require specialized histopath review.',
        'Incorrect. While optional, it is most critical when the primary result is unclear.',
        'Correct! Expert re-evaluation ensures diagnostic accuracy in complex cases where treatment plans are high-stakes.',
        'Incorrect. Blood counts are managed in Hematology, usually without tissue biopsy.'
      ]
    }
  }
];

// --- Components ---

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center w-full h-full cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      focus-within="focus-within:outline-none"
    >
      <div className="w-full truncate">
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] w-72 p-3 bg-gray-900 text-white text-[11px] leading-relaxed rounded-xl shadow-2xl pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BottomNav = ({ onShowReports }: { onShowReports: () => void }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 lg:hidden" aria-label="Bottom Navigation">
    <button 
      className="flex flex-col items-center gap-1 text-[#ff6f61] bg-[#ff6f61]/10 px-6 py-1 rounded-xl"
      aria-current="page"
    >
      <LayoutGrid className="w-6 h-6" aria-hidden="true" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Explore</span>
    </button>
    <button 
      onClick={onShowReports}
      className="flex flex-col items-center gap-1 text-gray-400 px-6 py-1"
    >
      <FileText className="w-6 h-6" aria-hidden="true" />
      <span className="text-[10px] font-bold uppercase tracking-wider">Reports</span>
    </button>
  </nav>
);

interface SegmentSectionProps {
  segment: Segment;
  onComplete: (id: string, scoreIncrement: number) => void;
  onTestAction: (points: number, type: string, extraData?: { testName: string }) => void;
}

const ReportPreview = ({ report, onClose }: { report: DriveFile; onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="absolute inset-0 z-[300] bg-slate-50 flex flex-col font-mono"
  >
    <div className="bg-[#212121] text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#ff6f61]" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{report.id.slice(0, 8)} - PREVIEW</span>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto p-4 sm:p-10 max-w-4xl mx-auto w-full">
      <div className="bg-white shadow-xl min-h-[800px] p-6 sm:p-16 border border-slate-200 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-12 border-b-2 border-slate-900 pb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Diagnostic Document</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Repository Access ©</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-black text-slate-900 break-all">{report.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ref ID: {report.id}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">Created: {new Date(report.createdTime).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 mb-8">
           {report.thumbnailLink ? (
             <img src={report.thumbnailLink.replace('=s220', '=s600')} alt="Preview" className="max-h-64 object-contain rounded-xl mb-6 shadow-lg shadow-black/5" />
           ) : (
             <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
               <FileText className="w-12 h-12" />
             </div>
           )}
           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Content Preview Unavailable</p>
           <p className="text-[10px] text-slate-400 max-w-xs mb-8">For full file content and medical validation, please access the external document view.</p>
           
           <button 
             onClick={() => window.open(report.webViewLink, '_blank')}
             className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
           >
             <ExternalLink className="w-3.5 h-3.5" />
             View Original
           </button>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center opacity-40 gap-4">
           <Trophy className="w-8 h-8 text-slate-400" />
           <p className="text-[8px] font-bold text-center">AUTHENTICATED ACCESS VIA GOOGLE DRIVE REPOSITORY SECURITY LAYER</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const ReportsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [viewingReport, setViewingReport] = useState<DriveFile | null>(null);
  const [reports, setReports] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const is1mgUser = auth.currentUser?.email?.toLowerCase().endsWith('@1mg.com');

  useEffect(() => {
    if (isOpen && auth.currentUser && is1mgUser) {
      loadReports();
    }
  }, [isOpen, auth.currentUser, is1mgUser]);

  const loadReports = async () => {
    const token = getAccessToken();
    if (!token) {
      setError("Authorization required. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportsFromDrive(token);
      setReports(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      // loadReports will be triggered by useEffect
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#212121]/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <AnimatePresence>
          {viewingReport && (
            <ReportPreview 
              report={viewingReport} 
              onClose={() => setViewingReport(null)} 
            />
          )}
        </AnimatePresence>

        <div className="bg-[#ff6f61] p-6 text-white relative overflow-hidden border-b border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-20 -mr-6 -mt-6">
             <FileText className="w-24 h-24 rotate-12" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-black tracking-tighter mb-1 relative z-10">Dummy Reports</h2>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest relative z-10">
            Authenticated Google Drive Repository
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          {!auth.currentUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Secure Access Required</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mb-8 leading-relaxed">
                To access medical reports from the specified repository, you must sign in with your Google Workspace account.
              </p>
              
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full sm:w-auto"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-bold text-xs">Sign in with Google</span>
                </div>
              </button>
            </div>
          ) : !is1mgUser ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-100 shadow-sm shadow-red-100/50 animate-pulse">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Access Restricted</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mb-4 leading-relaxed">
                Access to the Dummy Reports repository is restricted to official internal associates. To view these clinical summaries, please log in using a valid @1mg.com email address.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 mb-8 max-w-xs mx-auto">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed In As</p>
                <p className="text-xs font-black text-rose-600 font-mono mt-0.5 truncate">{auth.currentUser?.email}</p>
              </div>
              
              <button 
                onClick={() => auth.signOut()}
                className="px-6 py-3 bg-red-655 text-white bg-red-600 hover:bg-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Switch Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search reports by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-[#ff6f61] transition-all"
                />
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#ff6f61]/20 border-t-[#ff6f61] rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Repository...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-6 rounded-3xl text-center">
                  <Bug className="w-8 h-8 text-red-400 mx-auto mb-3" />
                  <h4 className="text-sm font-black text-red-900 mb-1">Synchronization Error</h4>
                  <p className="text-xs text-red-600 mb-6">{error}</p>
                  <button 
                    onClick={loadReports}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-200"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : reports.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div className="py-20 text-center">
                  <Focus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h4 className="text-sm font-black text-slate-900 mb-1">No Reports Found</h4>
                  <p className="text-xs text-slate-400">
                    {searchTerm ? `No results for "${searchTerm}"` : "The specified folder currently contains no diagnostic documents."}
                  </p>
                </div>
              ) : (
                reports
                  .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((report) => (
                  <div 
                    key={report.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border border-slate-100 bg-white hover:border-[#ff6f61]/30 hover:bg-[#ff6f61]/5 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0 min-w-0">
                      <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white flex items-center justify-center text-[#ff6f61] border border-slate-100 shadow-sm overflow-hidden">
                        {report.thumbnailLink ? (
                          <img src={report.thumbnailLink} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <FileText className="w-6 h-6" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate group-hover:text-[#ff6f61] transition-colors">
                          {report.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            {new Date(report.createdTime).toLocaleDateString()} • {report.mimeType.split('/').pop()}
                          </p>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 uppercase tracking-widest border border-green-100">
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setViewingReport(report)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10"
                      >
                        <Search className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button 
                        onClick={() => window.open(report.webViewLink, '_blank')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-mono"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Repo
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">
            Security: TLS 1.3 / OAuth 2.0
          </p>
          {auth.currentUser && (
            <button 
              onClick={() => auth.signOut()}
              className="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <Zap className="w-3 h-3" />
              Disconnect Session
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ChallengeModal = ({ 
  isOpen, 
  onClose, 
  questions, 
  currentIdx, 
  onAnswer, 
  score, 
  state, 
  onStart, 
  totalQuestions
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  questions: any[]; 
  currentIdx: number; 
  onAnswer: (correct: boolean) => void;
  score: number;
  state: 'intro' | 'active' | 'completed';
  onStart: () => void;
  totalQuestions: number;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#212121]/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#ff6f61] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 -mr-6 -mt-6">
             <Trophy className="w-24 h-24 rotate-12" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-black tracking-tighter mb-1 relative z-10">Diagnostic Quiz Challenge</h2>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest relative z-10">
            {state === 'active' ? `Question ${currentIdx + 1} of ${totalQuestions}` : 'Proof your proficiency'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {state === 'intro' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-10 h-10 text-[#ff6f61]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#212121] mb-2">Ready to test your limits?</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Appear for our daily curated diagnostic quiz. 3 challenging questions across different segments. Earn big points and appear on the leaderboard!
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={onStart}
                  className="w-full bg-[#ff6f61] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#ff6f61]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  START CHALLENGE
                </button>
              </div>
            </div>
          )}

          {state === 'active' && questions[currentIdx] && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-slate-100 text-slate-500`}>
                  {questions[currentIdx].segmentTitle}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#212121] leading-snug">
                {questions[currentIdx].question}
              </h3>
              <div className="grid gap-3">
                {questions[currentIdx].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onAnswer(i === questions[currentIdx].correctAnswer)}
                    className="w-full p-4 text-left border-2 border-gray-100 rounded-2xl font-bold text-sm text-gray-700 hover:border-[#ff6f61] hover:bg-[#ff6f61]/5 transition-all active:scale-[0.98]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state === 'completed' && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                <span className="text-3xl font-black text-green-500">{score}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#212121] mb-1">Challenge Completed!</h3>
                <p className="text-gray-500 text-sm mb-6">Excellent work. You earned {score} Explorer Points.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full border-2 border-gray-100 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-50 transition-all text-sm mt-4 uppercase tracking-widest"
              >
                Return to Directory
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};


const SegmentJourney = ({ accentColor }: { accentColor: string }) => {
  const steps = [
    { title: 'Order', icon: <FileText /> },
    { title: 'Sample', icon: <Droplets /> },
    { title: 'Process', icon: <Microscope /> },
    { title: 'Validate', icon: <CheckCircle2 /> },
    { title: 'Insight', icon: <Lightbulb /> },
  ];

  return (
    <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnostic Pathway</h4>
          <p className="text-[8px] text-gray-400 font-medium">Journey of specimen to precision result</p>
        </div>
        <Activity className={`w-4 h-4 ${accentColor} animate-pulse`} />
      </div>
      <div className="relative flex justify-between items-start">
        <div className="absolute top-4 left-0 w-full h-[1px] bg-gray-100 z-0" />
        {steps.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-8 h-8 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center transition-colors group-hover:border-gray-200`}
            >
              {React.cloneElement(step.icon as React.ReactElement<any>, { className: `w-3.5 h-3.5 ${accentColor}` })}
            </motion.div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-gray-900 uppercase tracking-tighter">{step.title}</span>
              <div className={`w-1 h-1 rounded-full mt-1 ${accentColor.replace('text-', 'bg-')}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Quiz = ({ 
  quiz, 
  accentColor, 
  segmentId,
  onComplete 
}: { 
  quiz: QuizQuestion; 
  accentColor: string; 
  segmentId: string;
  onComplete?: (score: number) => void;
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    if (onComplete) {
      onComplete(idx === quiz.correctAnswer ? 10 : 0);
    }
  };

  return (
    <section className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${accentColor.replace('text-', 'bg-')}/10`}>
          <HelpCircle className={`w-5 h-5 ${accentColor}`} />
        </div>
        <div>
          <h4 className={`text-xs font-bold ${accentColor} uppercase tracking-widest`}>Quick Knowledge Check</h4>
          <p className="text-gray-500 text-[10px] mt-0.5">Test your understanding of this segment</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-900 text-sm font-semibold leading-tight">
          {quiz.question}
        </p>
        
        <div className="grid gap-2">
          {quiz.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === quiz.correctAnswer;
            const showFeedback = selectedOption !== null;

            return (
              <button
                key={idx}
                disabled={showFeedback}
                onClick={() => handleSelect(idx)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left
                  ${showFeedback 
                    ? isCorrect 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : isSelected 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'bg-white border-gray-100 text-gray-400 opacity-60'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 cursor-pointer active:scale-[0.98]'
                  }
                `}
              >
                <span>{option}</span>
                {showFeedback && (
                  isCorrect ? <Check className="w-4 h-4" /> : isSelected ? <X className="w-4 h-4" /> : null
                )}
              </button>
            );
          })}
        </div>

        {selectedOption !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-4 overflow-hidden rounded-xl border ${
              selectedOption === quiz.correctAnswer 
                ? 'bg-green-50/50 border-green-100' 
                : 'bg-orange-50/50 border-orange-100'
            }`}
          >
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  selectedOption === quiz.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedOption === quiz.correctAnswer ? 'Correct' : 'Explanation'}
                </span>
              </div>
              <p className="text-gray-700 text-xs leading-relaxed">
                {quiz.explanations[selectedOption]}
              </p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    const el = document.getElementById(segmentId);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:opacity-80 transition-opacity ${accentColor}`}
                >
                  <Library className="w-3.5 h-3.5" />
                  Further Reading
                </button>
                <button 
                  onClick={() => setSelectedOption(null)}
                  className="text-gray-400 text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  Reset Quiz
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const SegmentSection: React.FC<SegmentSectionProps> = ({ segment, onComplete, onTestAction }) => {
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasTakenQuiz, setHasTakenQuiz] = useState(false);

  const handleTestExpand = (idx: number) => {
    if (expandedTest !== idx) {
      onTestAction(5, 'test_view', { testName: segment.testsCovered[idx].name });
    }
    setExpandedTest(expandedTest === idx ? null : idx);
  };

  useEffect(() => {
    if (hasScrolled && hasTakenQuiz) {
      onComplete(segment.id, 0);
    }
  }, [hasScrolled, hasTakenQuiz, segment.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setHasScrolled(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    const el = document.getElementById(segment.id);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [segment.id]);

  return (
    <motion.article 
      id={segment.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 scroll-mt-24 mb-12"
      aria-labelledby={`${segment.id}-title`}
    >
      <div className="h-48 relative">
        <img 
          src={segment.image} 
          alt={`Visual representation of ${segment.title}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" aria-hidden="true" />
      </div>

      <div className="px-8 pb-10 -mt-12 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-gray-50" aria-hidden="true">
              {segment.icon}
            </div>
            <h3 id={`${segment.id}-title`} className="text-3xl font-bold text-gray-900 tracking-tight">{segment.title}</h3>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById(`${segment.id}-tests`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            aria-label={`Jump to tests covered by ${segment.title}`}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${segment.accentColor} bg-white shadow-sm border border-gray-50 hover:shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${segment.accentColor.replace('text-', 'focus-visible:ring-')}`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Jump to Tests
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 mb-10 items-start">
          <div className="lg:col-span-12 space-y-8">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-8">
                <section className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm" aria-labelledby={`${segment.id}-about-heading`}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className={`w-4 h-4 ${segment.accentColor}`} />
                    <h4 id={`${segment.id}-about-heading`} className={`text-xs font-bold ${segment.accentColor} uppercase tracking-widest`}>What it's about</h4>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-sans text-[15px]">
                    {segment.description}
                  </p>
                </section>
                <section className={`p-6 bg-slate-50/80 rounded-2xl border-l-4 shadow-sm flex flex-col justify-between ${segment.bgColor.replace('bg-', 'border-')}`} aria-labelledby={`${segment.id}-utility-heading`}>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className={`w-4 h-4 ${segment.accentColor}`} />
                      <h4 id={`${segment.id}-utility-heading`} className={`text-xs font-bold ${segment.accentColor} uppercase tracking-widest`}>Clinical Utility</h4>
                    </div>
                    <p className="text-gray-800 leading-relaxed text-[15px] font-sans">
                      {segment.clinicalUtility}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button 
                      onClick={() => {
                        const text = `Diagnostic Insight from 1mg Dx Prism: "${segment.clinicalInsight}" - Explore more at our Diagnostic Segment repository.`;
                        if (navigator.share) {
                          navigator.share({ title: '1mg Dx Prism Insight', text, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(text);
                          alert('Insight copied to clipboard!');
                        }
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ff6f61] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Share Insight
                    </button>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i + (segment.id.length % 50)}`} alt="User" />
                        </div>
                      ))}
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                        +12
                      </div>
                    </div>
                  </div>
                </section>
                
                <Quiz 
                  quiz={segment.quiz} 
                  accentColor={segment.accentColor} 
                  segmentId={segment.id} 
                  onComplete={(score) => {
                    if (!hasTakenQuiz) {
                      setHasTakenQuiz(true);
                      onComplete(segment.id, score);
                    }
                  }}
                />
              </div>

              <div className="lg:col-span-5 space-y-8">
                <section className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm scroll-mt-24" id={`${segment.id}-tests`} aria-labelledby={`${segment.id}-tests-heading`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${segment.accentColor.replace('text-', 'bg-').replace('text-', 'bg-')}/10`} aria-hidden="true">
                      <CheckCircle2 className={`w-5 h-5 ${segment.accentColor}`} />
                    </div>
                    <h4 id={`${segment.id}-tests-heading`} className={`text-xs font-bold ${segment.accentColor} uppercase tracking-widest`}>Tests Covered</h4>
                  </div>
                  <div className="space-y-3">
                    {segment.testsCovered.map((test, idx) => (
                      <div 
                        key={idx} 
                        className="border border-gray-100 bg-white rounded-xl overflow-hidden transition-all group hover:border-gray-200"
                      >
                        <button
                          onClick={() => handleTestExpand(idx)}
                          className="w-full flex items-center justify-between p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-100"
                          aria-expanded={expandedTest === idx}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${segment.accentColor.replace('text-', 'bg-')}`} aria-hidden="true" />
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-700 text-sm font-semibold group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                                {test.name}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expandedTest === idx ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedTest === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-50 bg-gray-50/30">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Clinical Indications</p>
                                  <p className="text-gray-600 text-xs leading-relaxed">{test.indications}</p>
                                </div>
                                
                                <div className="flex items-center justify-between gap-4 pt-2">
                                  {test.link ? (
                                    <a 
                                      href={test.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-[10px] font-bold underline decoration-2 underline-offset-4 flex items-center gap-1.5 transition-opacity hover:opacity-70 text-blue-600 decoration-blue-200`}
                                    >
                                      View Detailed Clinical Info
                                      <Library className="w-3 h-3" />
                                    </a>
                                  ) : <div />}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </section>

                <DiagnosticFacts segmentInsight={segment.clinicalInsight} />
                
                <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ff6f61] opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2 mb-3 text-[#ff6f61]">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Interactive Guide</span>
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-medium">
                    Each diagnostic area features key insights to help you bridge the gap between clinical data and patient care. Use the quiz to test your mastery.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id={`${segment.id}-bottom-marker`} className="h-1 w-full" aria-hidden="true" />

        {segment.methodologies && (
          <section className="mt-12" aria-labelledby={`${segment.id}-comparison-heading`}>
            <h4 id={`${segment.id}-comparison-heading`} className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TableProperties className="w-6 h-6 text-[#005997]" aria-hidden="true" />
              Allergy Methodologies Comparison
            </h4>
            <div className="overflow-x-auto -mx-8 px-8 lg:mx-0 lg:px-0 snap-x">
              <table className="w-full min-w-[800px] border-collapse bg-white rounded-2xl shadow-sm border border-gray-100 table-fixed">
                <caption className="sr-only">Comparison of different allergy testing methodologies</caption>
                <thead>
                  <tr className="bg-[#005997] text-white text-left">
                    <th scope="col" className="sticky left-0 z-20 p-4 text-xs font-bold uppercase tracking-wider w-1/4 bg-[#005997] border-r border-white/10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]">Methodology</th>
                    <th scope="col" className="p-4 text-xs font-bold uppercase tracking-wider w-1/3 border-r border-white/10">Characteristics</th>
                    <th scope="col" className="p-4 text-xs font-bold uppercase tracking-wider w-1/6 border-r border-white/10">Test Results</th>
                    <th scope="col" className="p-4 text-xs font-bold uppercase tracking-wider w-1/4 border-r border-white/10">Advantages</th>
                    <th scope="col" className="p-4 text-xs font-bold uppercase tracking-wider w-1/4">Challenges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {segment.methodologies.map((m, idx) => (
                    <tr key={idx} className={`${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} group/row`}>
                      <th scope="row" className={`sticky left-0 z-10 p-4 font-bold text-[#005997] text-sm border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                        {m.name}
                      </th>
                      <td className="p-4 text-xs text-gray-600 border-r border-gray-100">
                        <Tooltip content={m.characteristics}>{m.characteristics}</Tooltip>
                      </td>
                      <td className="p-4 text-xs text-gray-600 border-r border-gray-100 font-medium">{m.results}</td>
                      <td className="p-4 text-xs text-gray-600 border-r border-gray-100">
                        <Tooltip content={m.advantages}>{m.advantages}</Tooltip>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        <Tooltip content={m.challenges}>{m.challenges}</Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[10px] text-gray-400 italic flex items-center gap-1">
              <Info className="w-3 h-3" aria-hidden="true" />
              Swipe horizontally to view full comparison details.
            </p>
          </section>
        )}
      </div>
    </motion.article>
  );
};

// Removed duplicate FAQ_DATA

const FloatingNavigator = ({ onNavigate }: { onNavigate: (id: string, title: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-6 z-[100] md:bottom-6 md:right-24">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[200px]"
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Navigate To</p>
            <div className="grid grid-cols-1 gap-1">
              {SEGMENTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    setIsOpen(false);
                    onNavigate(s.id, s.title);
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                    {React.cloneElement(s.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
                  </div>
                  <span className="text-xs font-bold text-gray-600 group-hover:text-[#ff6f61]">{s.title}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white text-[#ff6f61] p-4 rounded-full shadow-xl border border-gray-100 hover:shadow-2xl transition-all flex items-center justify-center"
      >
        <LayoutGrid className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

const CLINICAL_FACTS = [
  "Component-Resolved Diagnostics (CRD) can differentiate between a life-threatening nut allergy and a simple cross-reactivity.",
  "HbA1c reflects the average blood glucose level over the previous 8-12 weeks, the lifespan of a red blood cell.",
  "High-sensitivity Troponin-I can detect cardiac muscle injury within hours of onset, much earlier than standard methods.",
  "tTG Antibody tests are the 'gold standard' for non-invasive diagnosis of Celiac disease in symptomatic individuals.",
  "Liquid biopsy (ctDNA) can detect molecular recurrence of cancer months before it appears on a radiological scan."
];

const DiagnosticFacts = ({ segmentInsight }: { segmentInsight?: string }) => {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % CLINICAL_FACTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-[#ff6f61] to-[#ff8e83] rounded-3xl shadow-xl shadow-[#ff6f61]/20 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Lightbulb className="w-16 h-16 text-white" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-white/20 p-1.5 rounded-lg">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Clinical Expert Insight</span>
      </div>
      
      {segmentInsight ? (
        <div className="space-y-4 relative z-10">
          <p className="text-sm font-bold text-white leading-relaxed">
            {segmentInsight}
          </p>
          <div className="h-px w-12 bg-white/30" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={factIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 relative z-10"
          >
            <p className="text-sm font-bold text-white leading-relaxed min-h-[4rem]">
              "{CLINICAL_FACTS[factIndex]}"
            </p>
            <div className="h-px w-12 bg-white/30" />
            <p className="text-[10px] text-white/70 font-medium italic">
              Global Diagnostic Knowledge Point
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

const FAQ_DATA = [
  { question: "What is a CBC test?", answer: "A Complete Blood Count (CBC) provides information about red cells, white cells, and platelets. It is helpful in diagnosing anemia, infections, and leukemias." },
  { question: "Glucose Fasting rules?", answer: "For a Glucose Fasting test, a minimum of 8-12 hours of overnight fasting is mandatory. You can only consume water." },
  { question: "HbA1c significance?", answer: "HbA1c shows your average blood glucose level over the past 8-12 weeks. It is very reliable for evaluation of long-term control as it has less day-to-day variation." },
  { question: "COVID-19 RT-PCR details?", answer: "The RT-PCR test is used for detection of the Covid-19 virus. Common symptoms include fever, cough, and shortness of breath." },
  { question: "What does LFT include?", answer: "The Liver Function Test (LFT) assesses the functional activity of the liver. It includes Bilirubin, ALT(SGPT), AST(SGOT), ALP, GGT, and Albumin." },
  { question: "AMH test utility?", answer: "The Anti-Mullerian Hormone (AMH) test is the gold standard for assessing ovarian reserve and predicting outcomes for ART." },
  { question: "Thyroid TSH details?", answer: "TSH is an early indicator of decreased thyroid reserve. It helps diagnose hypo/hyperthyroidism. The sample should ideally be given at the same time of day for follow-ups." },
  { question: "Lipid Profile fasting?", answer: "Yes, 8-12 hours of overnight fasting is mandatory for a Lipid Profile. It measures Cholesterol, HDL, LDL, VLDL, and Triglycerides." },
  { question: "Kidney Function Test?", answer: "KFT assesses BUN, Urea, Creatinine, and Uric Acid to screen for kidney dysfunction." }
];

// Target Google Sheet: https://docs.google.com/spreadsheets/d/1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE/edit?gid=693551879#gid=693551879
const TARGET_GOOGLE_SHEET_ID = "1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE";
const TARGET_SHEET_GID = "693551879";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsBotTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ type: 'bot' | 'user'; text: string }[]>([
    { type: 'bot', text: 'Hello! I am your Tata 1mg Diagnostic Assistant. How can I help you today with your diagnostic queries?' }
  ]);

  const [chatSession] = useState(() => ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are a helpful and professional Diagnostic Assistant for Tata 1mg. 
      Your goal is to answer frequently asked questions about diagnostic tests based on the provided knowledge base, which includes a General Master Sheet and a Specialized Directory of Services.
      
      RULES:
      1. Always respond in clear, professional English. Do NOT use Hinglish or any other language unless specifically asked. 
      2. Consult BOTH the General and Specialized KNOWLEDGE BASE provided below. The Specialized directory contains high-end tests (NGS, FISH, PCR, etc.) for Cancer, Longevity, and Reproductive health.
      3. For any test queried, search first in the Specialized list, then the General list.
      4. If you find a match, explain its Clinical Utility, Specimen requirements, TAT (Turnaround Time), and any Special Instructions.
      5. NEVER mention prices, MRP, or costs. Suggest checking the app for current pricing.
      6. If a test is not found in the combined knowledge base, use general medical knowledge but explicitly state it is general information not specific to Tata 1mg's current directory.
      7. Keep answers concise, professional, and empathetic.
      8. Format responses using clean Markdown.
      
      KNOWLEDGE BASE (Combined General & Specialized):
      ${JSON.stringify([...TEST_KNOWLEDGE_BASE, ...SPECIALIZED_TESTS_KNOWLEDGE])}
      `
    }
  }));

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend) return;
    
    setInputText('');
    setMessages(prev => [...prev, { type: 'user', text: textToSend }]);
    setIsBotTyping(true);

    try {
      const result = await (chatSession as any).sendMessage({ message: textToSend });
      const response = result.text;
      setMessages(prev => [...prev, { type: 'bot', text: response || "I'm sorry, I couldn't understand that. Please try again." }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { type: 'bot', text: "I'm having some technical difficulties right now. Please try again in a moment." }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const [recognition, setRecognition] = useState<any>(null);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const newRecognition = new SpeechRecognition();
    newRecognition.lang = 'en-US';
    newRecognition.continuous = false;
    newRecognition.interimResults = false;

    newRecognition.onstart = () => setIsListening(true);
    newRecognition.onend = () => setIsListening(false);
    newRecognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      handleSend(transcript);
    };

    newRecognition.start();
    setRecognition(newRecognition);
  };

  const handleFaqClick = (faq: typeof FAQ_DATA[0]) => {
    handleSend(faq.question);
  };

  useEffect(() => {
    const end = document.getElementById('chat-end');
    if (end) end.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[500px] z-[100]"
          >
            <div className="bg-[#ff6f61] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Diagnostic Expert</h3>
                  <p className="text-[10px] opacity-80">Always active for your queries</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar text-[15px]">
               {messages.map((msg, idx) => (
                 <motion.div
                   key={idx}
                   initial={{ opacity: 0, x: msg.type === 'bot' ? -20 : 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className={`flex ${msg.type === 'bot' ? 'justify-start' : 'justify-end'}`}
                 >
                   <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed markdown-content ${
                     msg.type === 'bot' 
                       ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none' 
                       : 'bg-[#ff6f61] text-white shadow-md rounded-tr-none'
                   }`}>
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                 </motion.div>
               ))}
               {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200" />
                  </div>
                </motion.div>
              )}
               <div id="chat-end" />
             </div>

            <div className="p-4 border-t border-gray-100 bg-white space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  title="Speech to Text"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isListening ? "Listening..." : "Ask a diagnostic question..."}
                  className="flex-1 p-3 bg-gray-50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#ff6f61] border border-gray-100"
                />
                <button 
                  disabled={isTyping}
                  onClick={() => handleSend()}
                  className="bg-[#ff6f61] text-white p-3 rounded-xl hover:bg-[#e65a50] transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Common Questions</p>
                <div className="flex flex-wrap gap-2">
                  {FAQ_DATA.map((faq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFaqClick(faq)}
                      className="text-[10px] bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 transition-colors font-bold"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-[#ff6f61] text-white p-4 rounded-full shadow-xl hover:shadow-[#ff6f61]/30 transition-all flex items-center justify-center z-[110]"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#ffc4be] flex items-center justify-center text-[8px] font-black text-[#ff6f61]">1</span>
        </span>
      </motion.button>
    </>
  );
};

export default function App() {
  const [activeSegment, setActiveSegment] = useState('allergy');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [challengeQuestions, setChallengeQuestions] = useState<any[]>([]);
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeState, setChallengeState] = useState<'intro' | 'active' | 'completed'>('intro');

  const startChallenge = () => {
    // Pick 3 random segments
    const shuffled = [...SEGMENTS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(s => ({ ...s.quiz, segmentTitle: s.title, accentColor: s.accentColor }));
    setChallengeQuestions(selected);
    setCurrentChallengeIdx(0);
    setChallengeScore(0);
    setChallengeState('active');
    setShowChallenge(true);
  };
  const [userName, setUserName] = useState('');
  const [completedSegments, setCompletedSegments] = useState<Record<string, boolean>>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [stats, setStats] = useState({
    testsViewed: 0,
    quizzesCorrect: 0
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.name);
            setTotalScore(data.totalScore);
            if (data.recentlyViewed) {
              setRecentlyViewed(data.recentlyViewed);
            }
          } else if (user.displayName) {
            setUserName(user.displayName);
          }
        }).catch(err => {
          console.warn("Could not fetch user profile:", err.message);
        });
      } else {
        setUserName('');
        const localHistory = localStorage.getItem('recentlyViewed');
        if (localHistory) {
          setRecentlyViewed(JSON.parse(localHistory));
        }
      }
    });
    return () => unsub();
  }, []);

  const addToRecentlyViewed = (item: Omit<RecentlyViewedItem, 'timestamp'>) => {
    const newItem: RecentlyViewedItem = { ...item, timestamp: Date.now() };
    
    setRecentlyViewed(prev => {
      // Remove existing occurrence if any
      const filtered = prev.filter(p => !(p.id === item.id && p.type === item.type));
      const next = [newItem, ...filtered].slice(0, 5);
      
      // Save locally
      localStorage.setItem('recentlyViewed', JSON.stringify(next));
      
      // Save to Firebase if logged in
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        updateDoc(userRef, { recentlyViewed: next }).catch(e => {
          console.error("Error updating recentlyViewed:", e);
        });
      }
      
      return next;
    });
  };

  const handleRecentlyViewedClick = (item: RecentlyViewedItem) => {
    if (item.type === 'segment') {
      setActiveSegment(item.id);
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Find the segment containing this test and scroll to it
      const segment = SEGMENTS.find(s => s.testsCovered.some(t => t.name === item.title));
      if (segment) {
        setActiveSegment(segment.id);
        document.getElementById(segment.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // We could also potentially expand the test here if we pass state down, 
        // but scrolling to the segment is a good start.
      }
    }
  };

  const saveToFirebase = async (newScore: number, optionalName?: string) => {
    const nameToSave = optionalName || userName;
    if (!auth.currentUser || !nameToSave) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await setDoc(userRef, {
        name: nameToSave,
        totalScore: newScore,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  };

  const saveCheckin = async (segmentId: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'checkins'), {
        segmentId,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser.uid}/checkins`);
    }
  };



  const handleTestAction = (points: number, type: string, extraData?: { testName: string }) => {
    setTotalScore(prev => prev + points);

    if (type === 'test_view') {
      setStats(prev => {
        const next = prev.testsViewed + 1;
        if (next >= 10 && !badges.includes('scout')) setBadges(b => [...b, 'scout']);
        return { ...prev, testsViewed: next };
      });
      if (extraData?.testName) {
        addToRecentlyViewed({ id: extraData.testName, title: extraData.testName, type: 'test' });
      }
    }
    if (type === 'quiz_correct') {
      setStats(prev => {
        const next = prev.quizzesCorrect + 1;
        if (next >= 3 && !badges.includes('scholar')) setBadges(b => [...b, 'scholar']);
        return { ...prev, quizzesCorrect: next };
      });
    }
  };

  const markSegmentComplete = (id: string, scoreIncrement: number) => {
    if (!completedSegments[id]) {
      let finalName = userName;
      // Check if user has name before completing
      if (!userName.trim()) {
        const name = prompt("Please enter your name to save progress and join the leaderboard:");
        if (name) {
          finalName = name;
          setUserName(name);
          // Actual update will happen in state change trigger or saveToFirebase
        } else {
          return; // Don't complete if they cancel name input
        }
      }

      setCompletedSegments(prev => ({ ...prev, [id]: true }));
      const nextScore = totalScore + scoreIncrement;
      setTotalScore(nextScore);
      
      if (finalName.trim()) {
        saveToFirebase(nextScore, finalName);
      }
      saveCheckin(id);
      
      // Store in Google Sheets (Format)
      saveToGoogleSheet({
        name: finalName || "Anonymous Explorer",
        segmentId: id,
        score: scoreIncrement,
        timestamp: new Date().toISOString()
      });
      
      const count = Object.keys(completedSegments).length + 1;
      if (count >= 5 && !badges.includes('pathfinder')) setBadges(b => [...b, 'pathfinder']);
      if (count >= 10 && !badges.includes('expert')) setBadges(b => [...b, 'expert']);
    }
  };

  const saveToGoogleSheet = async (data: any) => {
    // Note for User: Connect to Google Sheet ID: 1hOXgo4LDf98UMvGEWTbuMAnLIc47Ssc5jR0cb9pUbjE
    // Tab: Quiz Score (GID: 693551879)
    // Complete instructions available in HOSTING_GUIDE.md
    // Use this Google Apps Script (Extensions > Apps Script):
    /*
    function doPost(e) {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Quiz Score");
      var rowData = JSON.parse(e.postData.contents);
      sheet.appendRow([new Date(), rowData.name, rowData.segmentId, rowData.score]);
      return ContentService.createTextOutput("Success");
    }
    */
    const sheetUrl = (import.meta as any).env.VITE_GOOGLE_SHEET_URL;
    if (!sheetUrl) {
      console.warn("Google Sheet URL (VITE_GOOGLE_SHEET_URL) is not set. Data saved to Firebase only.");
      return;
    }
    
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error("Google Sheet Save Error:", e);
    }
  };

  const filteredSegments = SEGMENTS.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.testsCovered.some(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter(e => e.isIntersecting);
        if (intersecting.length > 0) {
          // Find the one that's most visible or just the first one
          const mostVisible = intersecting.reduce((prev, curr) => 
            curr.intersectionRatio > prev.intersectionRatio ? curr : prev
          );
          setActiveSegment(mostVisible.target.id);
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: '-20% 0px -20% 0px' }
    );

    SEGMENTS.forEach((segment) => {
      const el = document.getElementById(segment.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const progressBar = document.getElementById('scroll-progress');
      if (progressBar) progressBar.style.width = scrolled + '%';
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f7f7] font-sans pb-24 text-[#212121]">
      <div className="fixed top-16 left-0 w-full h-1 z-[60]">
        <div id="scroll-progress" className="h-full bg-[#ff6f61] w-0 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(255,111,97,0.5)]"></div>
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white shadow-md border-b border-gray-100" role="banner">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-auto flex items-center">
              <img 
                src="https://www.1mg.com/images/tata_1mg_logo.svg"
                alt="Tata 1mg Logo" 
                className="h-7 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-sans font-extrabold text-[#212121] tracking-tighter text-xl ml-1">
              Dx Prism
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <Search className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <Focus className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-[100] max-h-[70vh] overflow-y-auto custom-scrollbar"
                >
                  <p className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">Diagnostic Segments</p>
                  {SEGMENTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                        setIsMenuOpen(false);
                        addToRecentlyViewed({ id: s.id, title: s.title, type: 'segment' });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                        {React.cloneElement(s.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-[#ff6f61]">{s.title}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      
      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <header className="mb-12 relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute -bottom-4 left-0 h-1 bg-[#ff6f61]/20 rounded-full"
          />
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#ff6f61]/10 p-3 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-[#ff6f61]" />
            </div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-6xl font-black text-[#212121] tracking-tighter leading-tight"
            >
              Diagnostic <span className="text-[#ff6f61]">Segments</span>
            </motion.h2>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#ff6f61] transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagnostic segments, tests (e.g. Allergy, HbA1c)..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ff6f61]/20 focus:border-[#ff6f61] transition-all text-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg max-w-3xl leading-relaxed mb-10"
          >
            A centralized repository offering deep-dives into diagnostic pillars, with a focus on clinical value and test precision across diagnostic segments
          </motion.p>

          <RecentlyViewed items={recentlyViewed} onItemClick={handleRecentlyViewedClick} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3 sticky top-28 h-[calc(100vh-140px)] space-y-6 overflow-y-auto custom-scrollbar pr-2">
            <nav className="p-2 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-1" aria-label="Sections navigation">
              {filteredSegments.length > 0 ? filteredSegments.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSegment(s.id);
                    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    addToRecentlyViewed({ id: s.id, title: s.title, type: 'segment' });
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f61] ${
                    activeSegment === s.id 
                      ? 'bg-[#ff6f61]/10 text-[#ff6f61] shadow-[0_0_20px_rgba(255,111,97,0.1)]' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={activeSegment === s.id ? 'location' : undefined}
                >
                  {activeSegment === s.id && (
                    <motion.div 
                      layoutId="sidebar-highlight"
                      className="absolute left-0 w-1 h-2/3 bg-[#ff6f61] rounded-r-full"
                    />
                  )}
                  <span className={`transition-colors ${activeSegment === s.id ? 'text-[#ff6f61]' : 'text-gray-400 group-hover:text-gray-600'}`} aria-hidden="true">
                    {React.cloneElement(s.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                  </span>
                  <span className="font-bold text-sm tracking-tight">{s.title}</span>
                  {completedSegments[s.id] && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </motion.div>
                  )}
                </a>
              )) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400 font-medium italic">No results found</p>
                </div>
              )}
            </nav>

            <section className="p-6 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Diagnostic Vault</span>
                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight">Dummy Reports</h3>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Connect and search sample diagnostic profiles and view mock test reports.
              </p>
              <button 
                onClick={() => setShowReports(true)}
                className="w-full flex items-center justify-between p-5 bg-white hover:bg-blue-50/70 border border-blue-200 hover:border-blue-300 rounded-2xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="text-left font-sans">
                  <p className="text-xs font-black text-blue-700 tracking-wider uppercase">Open Dummy Reports</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Full-text search included</p>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </section>

            <section className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#ff6f61]/10 p-2 rounded-xl">
                    <Trophy className="w-5 h-5 text-[#ff6f61]" />
                  </div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</h4>
                </div>
                <div className="flex items-baseline gap-1 font-sans">
                  <span className="text-3xl font-black text-[#ff6f61]">{totalScore}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">EXP</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-50 p-2 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Journey Hub</h4>
                </div>
                <DiagnosticFacts segmentInsight={SEGMENTS.find(s => s.id === activeSegment)?.clinicalInsight} />
              </div>
            </section>
          </aside>

          <div className="lg:col-span-9">
            {filteredSegments.length > 0 ? (
              filteredSegments.map((segment) => (
                <SegmentSection 
                  key={segment.id} 
                  segment={segment} 
                  onComplete={markSegmentComplete}
                  onTestAction={handleTestAction}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="bg-[#ff6f61]/10 p-6 rounded-full mb-6">
                  <Search className="w-12 h-12 text-[#ff6f61] opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 text-center max-w-xs">
                  We couldn't find any segments or tests matching "{searchQuery}". Try a different keyword like "Allergy", "Cardiology", or "HbA1c".
                </p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-[#ff6f61] font-bold text-sm hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Diagnostic Knowledge Challenge Section */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-10 mb-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 -mr-6 -mt-6 group-hover:rotate-12 transition-transform duration-500 hover:scale-110" aria-hidden="true">
                <Trophy className="w-32 h-32 text-[#ff6f61]" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-2 w-2 rounded-full bg-[#ff6f61] animate-ping" />
                    <span className="text-[10px] font-black text-[#ff6f61] uppercase tracking-[0.2em]">Active Quiz Hub</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Knowledge Challenge</h3>
                  <p className="text-xs text-slate-505 font-medium mt-1 leading-relaxed max-w-xl">
                    Test your diagnostic segment proficiency and clinical utility understanding. Level up your EXP and earn badges by appearing for random interactive quizzes.
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[#ff6f61]" /> {totalScore} EXP Points</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {stats.quizzesCorrect} Quizzes Solved</span>
                  </div>
                </div>
                <button 
                  onClick={startChallenge}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-[#333] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  APPEAR FOR quiz
                  <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Run Day-NRL, OKhla Section */}
            <NrlOkhlaSection />

            <ChatBot />
          </div>
        </div>
      </main>

      <BottomNav onShowReports={() => setShowReports(true)} />
      <FloatingNavigator onNavigate={(id, title) => addToRecentlyViewed({ id, title, type: 'segment' })} />
      
      <ReportsModal isOpen={showReports} onClose={() => setShowReports(false)} />
      
      <ChallengeModal 
        isOpen={showChallenge}
        onClose={() => setShowChallenge(false)}
        questions={challengeQuestions}
        currentIdx={currentChallengeIdx}
        score={challengeScore}
        state={challengeState}
        onStart={() => setChallengeState('active')}
        totalQuestions={challengeQuestions.length}
        onAnswer={(correct) => {
          const points = correct ? 20 : 0;
          const nextScore = challengeScore + points;
          setChallengeScore(nextScore);
          
          if (currentChallengeIdx < challengeQuestions.length - 1) {
            setCurrentChallengeIdx(prev => prev + 1);
          } else {
            setChallengeState('completed');
            setTotalScore(prev => prev + nextScore);
          }
        }}
      />
    </div>
  );
}
