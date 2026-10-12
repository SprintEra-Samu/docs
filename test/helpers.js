const bcrypt = require('bcrypt');
const request = require('supertest');
const app = require('../server');
const { sequelize, Role, User } = require('../models');

// Tüm tabloları silip yeniden oluşturur (yalnızca TEST veritabanında!)
const resetDb = () => sequelize.sync({ force: true });

let counter = 0;
const uniqueEmail = (prefix = 'user') =>
  `${prefix}${Date.now()}_${++counter}@sprintera.test`;

// DB'ye doğrudan kullanıcı ekler (register endpoint'ine bağımlı olmadan).
const createUser = async ({
  name = 'Test Kullanıcı',
  email = uniqueEmail(),
  password = 'Passw0rd!',
  roleName = 'Ekip Üyesi'
} = {}) => {
  const [role] = await Role.findOrCreate({ where: { name: roleName } });
  const password_hash = await bcrypt.hash(password, 4); // testlerde düşük maliyet = hızlı
  const user = await User.create({ name, email, password_hash, role_id: role.id });
  return { user, role, email, password };
};

const loginAs = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

module.exports = { app, sequelize, resetDb, uniqueEmail, createUser, loginAs };
