import {
  AuthenticationBindings,
  AuthenticationMetadata,
  AuthenticationStrategy,
} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {RolMenuRepository} from '../repositories';
import {SeguridadUsuarioService} from '../services';

/* Es una estrategia de autenticación personalizada que verifica si el usuario
tiene los permisos correctos para realizar la acción solicitada. */
export class AuthStrategy implements AuthenticationStrategy {
  name: string = 'auth';

  constructor(
    @service(SeguridadUsuarioService)
    private servicioSeguridad: SeguridadUsuarioService,
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
    @repository(RolMenuRepository)
    private repositorioRolMenu: RolMenuRepository,
  ) {}

  /**
   * Comprueba si el usuario tiene derecho a realizar la acción en el recurso.
   * @param {Request} request - La solicitud entrante.
   * @returns Un objeto UserProfile con una propiedad denominada permitido.
   */
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let token = parseBearerToken(request);

    if (token) {
      let idRol = this.servicioSeguridad.obtenerRolToken(token);
      let idMenu: string = this.metadata[0].options![0];
      let accion: string = this.metadata[0].options![1];

      let permiso = await this.repositorioRolMenu.findOne({
        where: {
          rolId: idRol,
          menuId: idMenu,
        },
      });
      let continuar: Boolean = false;
      if (permiso) {
        switch (accion) {
          case 'guardar':
            continuar = permiso.guardar;
            break;
          case 'editar':
            continuar = permiso.editar;
            break;
          case 'listar':
            continuar = permiso.listar;
            break;
          case 'eliminar':
            continuar = permiso.eliminar;
            break;
          case 'descargar':
            continuar = permiso.descargar;
            break;
          default:
            throw new HttpErrors[401](
              'NO es posible ejecutar la accion porque no existe',
            );
            break;
        }
        if (continuar) {
          let perfil: UserProfile = Object.assign({
            permitido: 'ok',
          });
          return perfil;
        } else {
          return undefined;
        }
      } else {
        throw new HttpErrors[401](
          'No es posible ejecutar la accion, falta de permisos',
        );
      }
    }
    throw new HttpErrors[401](
      'No es posible ejecutar la accion, falta de token',
    );
  }
}
