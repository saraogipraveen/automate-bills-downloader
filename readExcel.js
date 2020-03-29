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

function readExcelFile() {
    return new Promise((resolve, reject) => {
        readXlsxFile(file, { schema }).then(({ rows, errors }) => {
            errors.length > 0 ? reject(errors) : resolve(rows)
        })
    })
}


module.exports = readExcelFile

// const input = document.getElementById('excelFile')

// input.addEventListener('change', () => {
//     readXlsxFile(input.files[0], { schema }).then(({ rows, errors }) => {
//         console.log("errors", errors)
//         console.log("rows", rows)
//     })
// })



