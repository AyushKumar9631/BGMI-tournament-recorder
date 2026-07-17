export interface TeamOption {
  id: string;
  name: string;
  tag: string | null;
}

export interface SlotData {
  id: string;
  match_id: string;
  slot_number: number;
  team_id: string | null;
  is_locked: boolean;
  position: number | null;
  kills: number;
  placement_points: number;
  total_points: number;
  wwcd: boolean;
  team: TeamOption | null;
}
