const readXlsxFile = require('read-excel-file/node');

const schema = {
    'Consumer': {
        prop: 'consumer',
        type: Number,
        required: true
    },
    'unit': {
        prop: 'unit',
        type: Number,
        required: true
    }
}
const file = 'bills.xlsx';

readXlsxFile(file, { schema }).then(({ rows, errors }) => {
    console.log("errors", errors)
    console.log("rows", rows)

})
