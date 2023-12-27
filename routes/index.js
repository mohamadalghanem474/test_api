const userRoute = require('./userRoute');
const authRoute = require('./authRoute');


const mountRoutes = (app) => {
  //auth & login
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/users', userRoute);

};

module.exports = mountRoutes;
