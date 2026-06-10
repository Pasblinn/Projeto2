export interface ReportParams {
  ordemId: string
  cliente: string
  inicio: string
  fim: string
}

export interface ReportProps {
  params: ReportParams
}
