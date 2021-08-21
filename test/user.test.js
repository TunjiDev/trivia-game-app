process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

const expect = chai.expect;

const server = 'http://127.0.0.1:9090';

describe('Delete User from Database', () => {
  let token = '';

  it('should not delete without token', done => {
    chai
      .request(server)
      .delete('/api/v1/user/')
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });

  it('should not delete without valid token', done => {
    chai
      .request(server)
      .delete('/api/v1/user/')
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        expect(res).to.have.status(401);
        done();
      });
  });

  it('should delete user',async done => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxMWY4MTEzODIyYTVhMDAxNmE4NWJjNSIsImlhdCI6MTYyOTQ1NDY2MiwiZXhwIjoxNjM3MjMwNjYyfQ.Gik0nEYnAA9_9K28LiCmbTVjdVQK2B-Xeez3EI328p';
    chai
      .request(server)
      .delete('/api/v1/user/')
      .auth(token, { type: 'bearer' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        done();
      });
  });
});
