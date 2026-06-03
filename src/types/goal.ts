/**
 * A goal and its milestones. Stored locally with milestones embedded;
 * maps onto the `goals` + `milestones` tables in 0002_goals.sql.
 */
export interface Milestone {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}
