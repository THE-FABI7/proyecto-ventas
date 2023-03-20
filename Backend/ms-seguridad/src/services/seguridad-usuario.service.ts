import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {configuracionSeguridad} from '../config/seguridad.config';
import {
  Credenciales,
  FactorDeAutenticacionPorCodigo,
  Login,
  Usuario,
} from '../models';
import {LoginRepository, UsuarioRepository} from '../repositories';
const generator = require('generate-password');
const MD5 = require('crypto-js/md5');
const jwt = require('jsonwebtoken');

@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadUsuarioService {
  constructor(
    @repository(UsuarioRepository)
    public repositoryUsuario: UsuarioRepository,
    @repository(LoginRepository)
    public repositoryLogin: LoginRepository,
  ) {}

  /*
   * Add service methods here
   */

  /**
   * Genera una cadena aleatoria de 10 caracteres.
   * @returns Una cadena de 10 caracteres que contiene números.
   */
  crearTextoAleatorio(n: number): string {
    let clave = generator.generate({
      length: n,
      numbers: true,
    });
    return clave;
  }

  /**
   * Toma una cadena como argumento y devuelve una cadena
   * @param {string} cadena - cadena
   * @returns La cadena encriptada.
   */
  cifrarTexto(cadena: string): string {
    let cadenaCifrada = MD5(cadena).toString();
    return cadenaCifrada;
  }

  /**
   * Toma un objeto Credenciales y devuelve una Promesa que se resuelve en un objeto
   * Usuario o nulo
   * @param {Credenciales} credenciales - Credenciales
   * @returns Usuario | nulo
   */
  async identificarUsuario(
    credenciales: Credenciales,
  ): Promise<Usuario | null> {
    let usuario = await this.repositoryUsuario.findOne({
      where: {
        correoElectronico: credenciales.correo,
        clave: credenciales.clave,
      },
    });
    return usuario as Usuario;
  }

  /**
   * Encuentra un registro de inicio de sesión en la base de datos donde la
   * identificación del usuario coincide con la identificación del usuario en las
   * credenciales, el código 2fa coincide con el código 2fa en las credenciales y
   * el código 2fa aún no se ha utilizado
   * @param {FactorDeAutenticacionPorCodigo} credenciales2fa -
   * FactorDeAutenticacionPorCodigo
   * @returns El objeto de inicio de sesión o nulo
   */
  async validarCodigo2fa(
    credenciales2fa: FactorDeAutenticacionPorCodigo,
  ): Promise<Usuario | null> {
    let login = await this.repositoryLogin.findOne({
      where: {
        usuarioId: credenciales2fa.usuarioId,
        codigo2fa: credenciales2fa.codigo2fa,
        estadoCodigo2fa: false,
      },
    });
    if (login) {
      let usuario = await this.repositoryUsuario.findById(
        credenciales2fa.usuarioId,
      );
      return usuario;
    }
    return null;
  }

  /**
   * Toma un objeto de usuario, crea un nuevo objeto con el nombre, la función y el
   * correo electrónico del usuario, y luego usa la biblioteca jwt para crear un
   * token usando el nuevo objeto y la clave secreta.
   * @param {Usuario} usuario - Usuario: este es el objeto de usuario que se pasa
   * desde el método de inicio de sesión.
   * @returns El token está siendo devuelto.
   */
  crearToken(usuario: Usuario) {
    let datos = {
      name: `${usuario.primerNombre} ${usuario.segundoNombre} ${usuario.primerApellido} ${usuario.segundoApellido}`,
      role: usuario.rolId,
      email: usuario.correoElectronico,
    };
    var token = jwt.sign(datos, configuracionSeguridad.clavejwt);
    return token;
  }

  /**
   * Toma un token como parámetro, lo verifica y devuelve el rol del usuario
   * @param {string} tk - string: El token a decodificar.
   * @returns El rol del usuario.
   */
  obtenerRolToken(tk: string): string {
    let obj = jwt.verify(tk, configuracionSeguridad.clavejwt);
    return obj.role;
  }
}
