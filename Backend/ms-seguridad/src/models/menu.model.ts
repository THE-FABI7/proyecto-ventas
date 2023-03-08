import {Entity, model, property, hasMany} from '@loopback/repository';
import {Rol} from './rol.model';
import {RolMenu} from './rol-menu.model';

/* La clase Menú es un modelo que representa un menú en la base de datos. */
@model()
export class Menu extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  _id?: string;

  @property({
    type: 'string',
    required: true,
  })
  nombre: string;

  @property({
    type: 'string',
  })
  descripcion?: string;

  @hasMany(() => Rol, {through: {model: () => RolMenu}})
  roles: Rol[];

  constructor(data?: Partial<Menu>) {
    super(data);
  }
}

export interface MenuRelations {
  // describe navigational properties here
}

export type MenuWithRelations = Menu & MenuRelations;
