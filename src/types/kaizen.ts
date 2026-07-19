export type ProjectStatus = "Draft" | "On Progress" | "Under Review" | "Completed";

export interface HeaderData {
  title: string;
  department: string;
  leader: string;
  teamMembers: string;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
}

export interface Step1Data {
  standard: string;
  currentSituation: string;
  gap: string;
  sinceWhen: string;
  impact: string;
  images: Array<{ id: string; url: string; caption: string }>;
}

export interface WhatWhenWhereWho {
  what: string;
  when: string;
  where: string;
  who: string;
}

export interface SupportingDataRow {
  id: string;
  area: string;
  eventDate: string;
  category: string;
  detailModel: string;
  quantity: string;
}

export interface Step2Data {
  fourWOneH: WhatWhenWhereWho;
  supportingData: SupportingDataRow[];
}

export interface SmartPrinciples {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBased: string;
}

export interface Step3Data {
  smart: SmartPrinciples;
  improvement: string;
  targetValue: string;
  completionDate: string;
  projectTheme: string;
}

export interface Fishbone5ME {
  man: string;
  machine: string;
  method: string;
  material: string;
  environment: string;
}

export interface PotentialCauseRow {
  id: string;
  cause: string;
  checkMethod: string;
  result: string;
}

export interface FiveWhys {
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
}

export interface Step4Data {
  fishbone: Fishbone5ME;
  fishboneImage?: string;
  mostPotentialCauses: PotentialCauseRow[];
  fiveWhys: FiveWhys;
}

export interface ActionPlanRow {
  id: string;
  plan: string;
  area: string;
  pic: string;
  targetDate: string;
  progress: number; // 0 to 100
}

export interface Step5And6Data {
  shortTermPlan: string;
  longTermPlan: string;
  actionPlans: ActionPlanRow[];
}

export interface FollowUpChartPoint {
  label: string;
  standard: number;
  before: number;
  after: number;
}

export type FollowUpDecision =
  | "proliferasi"
  | "monitoring"
  | "pdca_ulang"
  | "eskalasi";

export interface Step7Data {
  checkMethod: string;
  checkFrequency: string;
  checkPic: string;
  testResultSummary: string;
  chartData: FollowUpChartPoint[];
  chartImage?: string;
  followUpDecision: FollowUpDecision;
  followUpNote: string;
}

export interface DocumentRow {
  id: string;
  docNumber: string;
  docName: string;
  status: string; // e.g., "Baru", "Revisi", "Dihentikan"
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
}

export interface Step8Data {
  documentsCreated: DocumentRow[];
  beforeCondition: string;
  afterCondition: string;
  beforeUrl?: string;
  afterUrl?: string;
  maintenancePic: string;
  effectiveDate: string;
  attachments: AttachmentItem[];
}

export interface KaizenContent {
  header: HeaderData;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5_6: Step5And6Data;
  step7: Step7Data;
  step8: Step8Data;
}

export interface KaizenProject {
  id: string;
  title: string;
  department: string;
  leader: string;
  teamMembers?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  status: ProjectStatus;
  currentStep: number;
  content: KaizenContent;
  createdAt?: string;
  updatedAt?: string;
}

export const EMPTY_KAIZEN_CONTENT: KaizenContent = {
  header: {
    title: "",
    department: "",
    leader: "",
    teamMembers: "",
    startDate: "",
    dueDate: "",
    status: "Draft",
  },
  step1: {
    standard: "",
    currentSituation: "",
    gap: "",
    sinceWhen: "",
    impact: "",
    images: [],
  },
  step2: {
    fourWOneH: {
      what: "",
      when: "",
      where: "",
      who: "",
    },
    supportingData: [
      {
        id: "s1",
        area: "",
        eventDate: "",
        category: "",
        detailModel: "",
        quantity: "",
      },
    ],
  },
  step3: {
    smart: {
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBased: "",
    },
    improvement: "",
    targetValue: "",
    completionDate: "",
    projectTheme: "",
  },
  step4: {
    fishbone: {
      man: "",
      machine: "",
      method: "",
      material: "",
      environment: "",
    },
    fishboneImage: "",
    mostPotentialCauses: [
      {
        id: "p1",
        cause: "",
        checkMethod: "",
        result: "",
      },
    ],
    fiveWhys: {
      why1: "",
      why2: "",
      why3: "",
      why4: "",
      why5: "",
      rootCause: "",
    },
  },
  step5_6: {
    shortTermPlan: "",
    longTermPlan: "",
    actionPlans: [
      {
        id: "a1",
        plan: "",
        area: "",
        pic: "",
        targetDate: "",
        progress: 0,
      },
    ],
  },
  step7: {
    checkMethod: "",
    checkFrequency: "",
    checkPic: "",
    testResultSummary: "",
    chartData: [
      { label: "Bulan 1", standard: 10, before: 25, after: 8 },
      { label: "Bulan 2", standard: 10, before: 28, after: 7 },
      { label: "Bulan 3", standard: 10, before: 30, after: 6 },
    ],
    chartImage: "",
    followUpDecision: "proliferasi",
    followUpNote: "",
  },
  step8: {
    documentsCreated: [
      {
        id: "d1",
        docNumber: "",
        docName: "",
        status: "Dibuat",
      },
    ],
    beforeCondition: "",
    afterCondition: "",
    beforeUrl: "",
    afterUrl: "",
    maintenancePic: "",
    effectiveDate: "",
    attachments: [],
  },
};
