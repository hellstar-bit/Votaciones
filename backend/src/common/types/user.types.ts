// 📁 src/common/types/user.types.ts
export interface CurrentUserData {
  id: number;
  username: string;
  email: string;
  roles: string[];
  centro?: {
    id: number;
    nombre: string;
  };
  sede?: {
    id: number;
    nombre: string;
  };
  ficha?: {
    id: number;
    numero: string;
  };
}