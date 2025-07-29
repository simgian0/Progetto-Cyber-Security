import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { Database } from '../database/database';
import User from './User'; 

// Initialize Sequelize instance from the Database class
const sequelize: Sequelize = Database.getSequelize();

// Attributes Drawing
interface DrawingAttributes {
    id: number;
    name: string;
    owner_id: number;
    target_team: string;
    created_at?: Date;
    points?: string;
    lines?: string;
    texts?: string;
}

// Attributes used only during creation (id and created_at are optional)
interface DrawingCreationAttributes extends Optional<DrawingAttributes, 'id' | 'created_at'> { }

// Drawing Model definition
class Drawing extends Model<DrawingAttributes, DrawingCreationAttributes> implements DrawingAttributes {
    public id!: number;
    public name!: string;
    public owner_id!: number;
    public target_team!: string;
    public created_at?: Date;
    public points?: string;
    public lines?: string;
    public texts?: string;
}

// model init
Drawing.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    target_team: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    points: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    lines: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    texts: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'drawings',
    timestamps: false
});

// User association
Drawing.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

export default Drawing;