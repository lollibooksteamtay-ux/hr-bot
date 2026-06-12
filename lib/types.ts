export type JobStatus = 'active' | 'closed';

export type CandidateStatus =
  | 'received'
  | 'reviewing'
  | 'interview'
  | 'offered'
  | 'rejected';

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary: string;
  company: string;
  contact: string;
  fb_post_id: string | null;
  fb_group_content: string | null;
  status: JobStatus;
  created_at: string;
  candidate_count?: number;
}

export interface Candidate {
  id: number;
  job_id: number;
  job_title?: string;
  name: string;
  email: string;
  phone: string;
  cover_letter: string;
  cv_path: string | null;
  cv_filename: string | null;
  cv_score: number | null;
  cv_summary: string | null;
  cv_strengths: string | null;
  cv_weaknesses: string | null;
  cv_recommendation: 'pass' | 'review' | 'reject' | null;
  status: CandidateStatus;
  notes: string;
  created_at: string;
}

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  received: 'Đã nhận hồ sơ',
  reviewing: 'Đang xem xét',
  interview: 'Mời phỏng vấn',
  offered: 'Đã nhận',
  rejected: 'Không phù hợp',
};

export const STATUS_COLOR: Record<CandidateStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  interview: 'bg-purple-100 text-purple-700',
  offered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};
