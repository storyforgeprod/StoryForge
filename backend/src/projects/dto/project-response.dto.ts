export class OutputResponseDto {
  videoUrl!: string;
  audioUrl!: string | null;
  images!: string[];
  script!: string | null;
  duration!: number | null;
}

export class ProjectResponseDto {
  id!: string;
  title!: string;
  style!: string;
  duration!: number;
  status!: string;
  createdAt!: Date;
  output!: OutputResponseDto | null;
}
