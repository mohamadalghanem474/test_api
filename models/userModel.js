const bcrypt = require('bcryptjs')

module.exports=(sequelize,DataTypes)=>{
  const User = sequelize.define(
    'User',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Name is required' },
        },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: true,
        set(value) {
          this.setDataValue('slug', value.toLowerCase());
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Email is required' },
          isEmail: { msg: 'Invalid email format' },
        },
        set(value) {
          this.setDataValue('email', value.toLowerCase());
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profileImg: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password is required' },
          len: { args: [6], msg: 'Password should be at least 6 characters long' },
        },
      },
      passwordChangedAt: DataTypes.DATE,
      passwordResetCode: DataTypes.STRING,
      passwordResetExpires: DataTypes.DATE,
      passwordResetVerified: DataTypes.BOOLEAN,
      emailVerifyCode: DataTypes.STRING,
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
        validate: {
          isIn: {
            args: [['user', 'admin']],
            msg: 'Invalid role',
          },
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          // Hashing user password
          user.password = await bcrypt.hash(user.password, 12);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );
  User.associate=(models)=>{
    // User.hasMany(models.Product,{
    //   onDelete:"cascade"
    // });
    /////
  }
  return User;
}
