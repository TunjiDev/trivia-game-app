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

});
