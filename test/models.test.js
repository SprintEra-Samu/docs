const { sequelize, resetDb, uniqueEmail } = require('./helpers');
const { User, Role, Permission } = require('../models');

beforeAll(resetDb);
afterAll(() => sequelize.close());

describe('User modeli', () => {
  let role;
  beforeAll(async () => {
    role = await Role.create({ name: 'Model Test Rolü' });
  });

  it('geçerli kullanıcı oluşturulur ve created_at dolar', async () => {
    const user = await User.create({
      name: 'A', email: uniqueEmail('m'), password_hash: 'hash', role_id: role.id
    });
    expect(user.id).toBeDefined();
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('updated_at alanı yoktur (updatedAt: false)', async () => {
    const user = await User.create({
      name: 'A', email: uniqueEmail('m'), password_hash: 'hash', role_id: role.id
    });
    expect(user.updated_at).toBeUndefined();
  });

  test.each(['name', 'email', 'password_hash'])('%s zorunludur', async (field) => {
    const data = { name: 'A', email: uniqueEmail('m'), password_hash: 'hash', role_id: role.id };
    delete data[field];
    await expect(User.create(data)).rejects.toThrow();
  });

  it('e-posta tekildir', async () => {
    const email = uniqueEmail('dup');
    await User.create({ name: 'A', email, password_hash: 'h', role_id: role.id });
    await expect(
      User.create({ name: 'B', email, password_hash: 'h', role_id: role.id })
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });

  it('olmayan role_id yabancı anahtar hatası verir', async () => {
    await expect(
      User.create({ name: 'A', email: uniqueEmail('fk'), password_hash: 'h', role_id: 999999 })
    ).rejects.toMatchObject({ name: 'SequelizeForeignKeyConstraintError' });
  });

  it('User -> Role ilişkisi include ile çalışır', async () => {
    const user = await User.create({
      name: 'A', email: uniqueEmail('inc'), password_hash: 'h', role_id: role.id
    });
    const found = await User.findByPk(user.id, { include: Role });
    expect(found.Role.name).toBe('Model Test Rolü');
  });

  it('Role -> Users ilişkisi çalışır', async () => {
    const r = await Role.create({ name: 'Boş Rol' });
    await User.create({ name: 'A', email: uniqueEmail('rs'), password_hash: 'h', role_id: r.id });
    const users = await r.getUsers();
    expect(users).toHaveLength(1);
  });
});

describe('Permission ve Role-Permission ilişkisi', () => {
  it('permission code tekildir', async () => {
    await Permission.create({ code: 'project.create' });
    await expect(Permission.create({ code: 'project.create' })).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError'
    });
  });

  it('permission code zorunludur', async () => {
    await expect(Permission.create({})).rejects.toThrow();
  });

  it('role ile permission çoka-çok bağlanır', async () => {
    const role = await Role.create({ name: 'İzinli Rol' });
    const p1 = await Permission.create({ code: 'task.read' });
    const p2 = await Permission.create({ code: 'task.write' });

    await role.addPermissions([p1, p2]);

    const perms = await role.getPermissions();
    expect(perms.map((p) => p.code).sort()).toEqual(['task.read', 'task.write']);

    const roles = await p1.getRoles();
    expect(roles.map((r) => r.id)).toContain(role.id);
  });

  it('aynı permission aynı role iki kez eklenince kayıt çoğalmaz', async () => {
    const role = await Role.create({ name: 'Tekrar Rol' });
    const p = await Permission.create({ code: 'sprint.read' });

    await role.addPermission(p);
    await role.addPermission(p);

    expect(await role.countPermissions()).toBe(1);
  });
});
