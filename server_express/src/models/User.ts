import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Database } from '../database/database';

// Initialize Sequelize instance from the Database class
const sequelize: Sequelize = Database.getSequelize();

// Interface for the attributes of the User model
interface UserAttributes {
    id: number;
    name: string;
    role: string;
    team: string;
}

// Interface for attributes needed only during creation
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

// Definition of the User model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public role!: string;
    public team!: string;
}

// Model initialization
User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    team: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    sequelize: sequelize,
    tableName: 'users',
    paranoid: false,
    timestamps: false,
});

export default User;