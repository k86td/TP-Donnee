const Model = require('./model');
module.exports = 
class Image extends Model{
    constructor()
    {
        super();
        this.Title = "";
        this.Description = "";
        this.Date =  0;
        this.GUID = "";
        this.Shared = false;
        this.UserId = 0;

        this.addValidator('Title','string');
        this.addValidator('Description', 'string');
    }
}