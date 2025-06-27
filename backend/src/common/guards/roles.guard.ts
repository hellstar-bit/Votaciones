// backend/src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // 🔧 CORRECCIÓN: usar 'rol' (singular) en lugar de 'roles' (plural)
    console.log('🛡️ RolesGuard - Usuario:', user);
    console.log('🛡️ RolesGuard - Rol usuario:', user?.rol);
    console.log('🛡️ RolesGuard - Roles requeridos:', requiredRoles);
    
    if (!user || !user.rol) {
      console.log('❌ RolesGuard - Usuario sin rol');
      return false;
    }
    
    const hasRole = requiredRoles.includes(user.rol);
    console.log('🛡️ RolesGuard - Tiene permiso:', hasRole);
    
    return hasRole;
  }
}