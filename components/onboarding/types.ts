export interface StepEmpresaData {
  nombreEmpresa: string
  rubro: string
  aniosMercado: string
  pais: string
  sitioWeb: string
  descripcion: string
}

export interface StepEquipoData {
  empleados: string
  facturacion: string
  areas: string[]
  herramientas: string[]
}

export interface UploadedDocument {
  name: string
  path: string
  size: number
}

export interface StepDocumentosData {
  archivos: UploadedDocument[]
  descripcionProcesos: string
}

export interface StepObjetivosData {
  objetivos: string[]
  problemaPrincipal: string
  tiempoResultados: string
}

export interface OnboardingData {
  empresa: StepEmpresaData
  equipo: StepEquipoData
  documentos: StepDocumentosData
  objetivos: StepObjetivosData
}

