// const readXlsxFile = require('read-excel-file/node');
import readXlsxFile from 'read-excel-file'
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
console.log('hello')

console.log("input", input)
const input = document.getElementById('excelFile')

input.addEventListener('change', () => {
    readXlsxFile(input.files[0], { schema }).then(({ rows, errors }) => {
        console.log("errors", errors)
        console.log("rows", rows)
    })
})



