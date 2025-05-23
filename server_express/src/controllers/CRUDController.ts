import { Request, Response } from 'express';
import { Model, ModelStatic, WhereOptions } from 'sequelize';

//Import factory
import { successFactory } from "../factory/SuccessMessage";
import { errorFactory } from "../factory/FailMessage";
import { SuccesMessage, ErrorMessage } from "../factory/Messages";
// Instantiate factory classes for success and error messages
const errorMessageFactory: errorFactory = new errorFactory();
const successMessageFactory: successFactory = new successFactory();

// Generic function to create a WHERE clause based on a primary key
const wherePrimaryKey = <T>(key: string, value: string | number): WhereOptions<T> => ({ [key]: value } as unknown as WhereOptions<T>);

class CRUDController {

    // Create a new record in the database
    async createRecord<T extends Model>(model: ModelStatic<T>, req: Request, res: Response): Promise<Response> {
        var result: any;
        try {
            // Create a new record with the request body
            const record = await model.create(req.body);
            const message = successMessageFactory.createMessage(SuccesMessage.createRecordSuccess, `New ${model.name} record created`)
            result = res.json({ success: message, data: record });
        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.createRecordError, `Error while creating new ${model.name} record`);
            return res.json({ error: message });
        }
        return result;
    }

    // Read a single record given its primary key
    async readOneRecord<T extends Model>(model: ModelStatic<T>, req: Request, res: Response): Promise<Response> {
        var result: any;
        try {
            // Get the primary key from the request parameters
            const pk = req.params.id as unknown as number | string;
            // Find the record by its primary key
            const record = await model.findByPk(pk);
            const message = successMessageFactory.createMessage(SuccesMessage.readRecordSuccess, `${model.name} record found`);
            result = res.json({ success: message, data: record });
        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.readRecordError, `Error while reading ${model.name} record`);
            result = res.json({ error: message });
        }
        return result;
    }

    // Update a record given its primary key
    async updateRecord<T extends Model>(model: ModelStatic<T>, req: Request, res: Response): Promise<Response> {
        var result: any;
        try {
            // Retrieve primary key attributes from the model
            const primaryKeys = model.primaryKeyAttributes;
            // Construct the WHERE clause for the primary key
            const primaryKeyValue = req.params.id as string | number;
            const whereClause = wherePrimaryKey<T>(primaryKeys[0], primaryKeyValue);

            // Update the record
            await model.update(req.body, {
                where: whereClause as WhereOptions<T>
            });

            // Find the updated record
            const updatedInstance = await model.findOne({
                where: whereClause as WhereOptions<T>
            });

            const message = successMessageFactory.createMessage(SuccesMessage.updateRecordSuccess, `${model.name} record updated successfully`);
            result = res.json({ success: message, data: updatedInstance });

        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.updateRecordError, `Error while updating ${model.name}`);
            result = res.json({ error: message });
        }
        return result;
    }

    // Delete a record given its primary key
    async deleteRecord<T extends Model>(model: ModelStatic<T>, req: Request, res: Response): Promise<Response> {
        var result: any;
        try {
            // Retrieve primary key attributes from the model
            const primaryKeys = model.primaryKeyAttributes;
            // Construct the WHERE clause for the primary key
            const primaryKeyValue = req.params.id as string | number;
            const whereClause = wherePrimaryKey<T>(primaryKeys[0], primaryKeyValue);
            // Delete the record
            const deleted = await model.destroy({
                where: whereClause as WhereOptions<T>
            });

            const message = successMessageFactory.createMessage(SuccesMessage.deleteRecordSuccess, `${model.name} record deleted`);
            result = res.json({ success: message });

        } catch (error) {
            const message = errorMessageFactory.createMessage(ErrorMessage.deleteRecordError, `Error while deleting ${model.name}`);
            result = res.json({ error: message });
        }
        return result;
    }
}
// Export a new instance of the CRUDController
export default new CRUDController();
