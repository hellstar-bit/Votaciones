# 🗳️ Sistema de Votaciones SENA

Sistema integral de votaciones electrónicas para el SENA.

## 🎯 Características

- ✅ Tres tipos de elecciones (Centro, Sede, Ficha)
- ✅ Autenticación con códigos QR
- ✅ Dashboard en tiempo real
- ✅ Prevención de fraude
- ✅ Auditoría completa

## 🚀 Stack Tecnológico

### Backend
- NestJS 11.1.3 + TypeORM 0.3.25
- MySQL 8.0.40 + Socket.io 4.8.1
- JWT + bcryptjs

### Frontend
- React 19.1.0 + Tailwind CSS 4.1.0
- Recharts 3.0.0 + Socket.io-client

## ⚡ Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## 🔑 Acceso

- Backend: http://localhost:3000/api/v1
- Frontend: http://localhost:3001
- Admin: admin / Admin123!
