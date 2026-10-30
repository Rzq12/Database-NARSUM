declare module '#auth-utils' {
  interface User {
    id: number
    role: import('../utils/akses').Role
    nama: string
    email: string
    tipe: 'asn' | 'non_asn' | null
  }

  interface UserSession {
    aktifTerakhir?: number
    versiSesi?: number
  }
}

export {}
