function IsSquare(matrix){
    
    let rows = matrix.length;

    for(let i = 0; i < rows; i++){
        if(matrix[i].length != rows){
            return false;
        }
    }

    return true;
}



function GetMatrixShape(matrix){
    const rows = matrix.length;
    const columns = matrix[0].length;

    const areRowsEqual = matrix.every((row) => row.length == columns);

    if (!areRowsEqual) {
        return rows,null;
    }

    return {rows,columns};
}



function sortMatrix(matrix, rowWithYouWillPivot) {
    let matrixSorted = matrix.slice(0, rowWithYouWillPivot); // Copiando las filas hasta el pivote

    matrix = matrix.slice(rowWithYouWillPivot); // Filas desde el pivote hacia abajo

    const columnWithYouWillPivot = rowWithYouWillPivot;

    for (let i = 0; i < matrix.length; i++) {
        if (matrix[i][columnWithYouWillPivot] !== 0) {
            let [row] = matrix.splice(i, 1); // Desestructurar para obtener la fila (evita array anidado)
            matrixSorted.push(row); // Añadir la fila correctamente
            break;
        }
    }

    matrixSorted = [...matrixSorted, ...matrix]; // Añadir el resto de filas de `matrix`
    
    return matrixSorted;
}



function Gauss(pMatrix){

    const {rows, columns} = GetMatrixShape(pMatrix);

    if (columns == null){
        throw new Error('The rows are not equal of size');
    }

    let matrix = pMatrix.map((row) => [...row]);

    matrix = sortMatrix(matrix, 0);

    

    for (let i = 0; i < rows - 1; i++) {
        let diagonalElement = matrix[i][i];
        if (diagonalElement == 0) {
            return matrix;
        }

        matrix[i] = matrix[i].map((element) => (element / diagonalElement));


        for (let j = i + 1; j < rows; j++) {
            let factor = matrix[j][i] * -1;
           
            if (factor == 0) {
                continue;
            }

            matrix[j] = matrix[j].map((element, column) => {
                return element + (factor * matrix[i][column]);
            });
        }

        
        matrix = sortMatrix(matrix, i);
       
    }

    return matrix;

}

function Determinant(pMatrix){
    if(!IsSquare(pMatrix)){
        return null;
    }

    let matrix = pMatrix.map((row) => [...row]);

    let determinant = 1;

    const rows = matrix.length;
    const columns = rows;

    for (let i = 0; i < rows - 1; i++) {
        let diagonalElement = matrix[i][i];
        
        if (diagonalElement == 0) {
            return 0;
        }

        determinant *= diagonalElement;

        matrix[i] = matrix[i].map((element) => (element / diagonalElement));


        for (let j = i + 1; j < rows; j++) {
            let factor = matrix[j][i] * -1;
           
            if (factor == 0) {
                continue;
            }

            matrix[j] = matrix[j].map((element, column) => {
                return element + (factor * matrix[i][column]);
            });
        }

        
        matrix = sortMatrix(matrix, i);
       
    }

    determinant *= matrix[rows - 1][columns - 1];
    
    const floorDeterminant = Math.floor(determinant);


    if (Math.abs(floorDeterminant - determinant) < 0.01) {
        return floorDeterminant;
    }


    const ceilDeterminant = Math.ceil(determinant);

    if (Math.abs(ceilDeterminant - determinant) < 0.01) {
        return ceilDeterminant;
    }
    

    return determinant;
}



function GaussJordan(pMatrix, pConstantTerms){

    let matrix = pMatrix.map((row) => [...row]);
    let constantTerms = [...pConstantTerms];

    if(!IsSquare(matrix)){
        return null;
    }

    const rows = matrix.length;
    

    for (let i = 0; i < rows;i++){
        matrix[i].push(constantTerms[i]);
    }

    const columns = rows + 1;

    try
    {
        matrix = Gauss(matrix);
    }
    catch(e){
        return e;
    }



    for (let i = rows - 1; i >= 0; i--) {
        let diagonalElement = matrix[i][i];
        
        if (diagonalElement == 0) {
            return matrix;
        }


        matrix[i] = matrix[i].map((element) => (element / diagonalElement));


        for (let j = i - 1; j >= 0; j--) {
            let factor = matrix[j][i] * -1;
           
            if (factor == 0) {
                continue;
            }

            matrix[j] = matrix[j].map((element, column) => {
                return element + (factor * matrix[i][column]);
            });
        }

        
        matrix = sortMatrix(matrix, i);
       
    }

    const solutions = matrix.map((row) => row[columns - 1]);

    
    return solutions;


}


function Transpose(pMatrix){

    let matrix = pMatrix.map((row) => [...row]);

    const {rows, columns} = GetMatrixShape(pMatrix);

    if (columns == null){
        throw new Error('The rows are not equal of size');
    }

    let transposedMatrix = [];

    for (let i = 0; i < columns; i++) {

        let row = [];

        for (let j = 0; j < rows; j++) {
            row.push(matrix[j][i]);
        }

        transposedMatrix.push(row);

    }

    return transposedMatrix;

}

function CofactorMatrix(pMatrix){

    if (!IsSquare(pMatrix)) {
        return null;
    }

    let matrix = pMatrix.map((row) => [...row]);

    const rows = matrix.length;
    const columns = matrix[0].length;

    let cofactorMatrix = [];

    for(let i = 0; i < rows; i++){
        let cofactorRow = [];
        let matrixWithoutRow = matrix.filter((row,index) => index != i);

        for (let j = 0; j < columns; j++) {
            let subMatrixForCofactor = matrixWithoutRow.map(
                (row) => row.filter((element,index) => index != j)
            );

            const determinant = Determinant(subMatrixForCofactor);
            const cofactor = Math.pow(-1, i + j) * determinant;

            cofactorRow.push(cofactor);
        }

        cofactorMatrix.push(cofactorRow);
    }

    return cofactorMatrix;
}

function Adjoint(pMatrix){
    return Transpose(CofactorMatrix(pMatrix));
}


function Inverse(pMatrix){

    if (!IsSquare(pMatrix)) {
        return null;
    }

    let matrix = pMatrix.map((row) => [...row]);

    const rows = matrix.length;

    let identityRow = [];
    for (let i = 0; i < matrix.length; i++) {
        identityRow = new Array(matrix.length).fill(0);
        identityRow[i] = 1;
        matrix[i] = matrix[i].concat(identityRow);
    }

    const columns = rows;


    matrix = Gauss(matrix);

    for (let i = rows - 1; i >= 0; i--) {
        let diagonalElement = matrix[i][i];
        
        if (diagonalElement == 0) {
            return null;
        }

        matrix[i] = matrix[i].map((element) => (element / diagonalElement));


        for (let j = i - 1; j >= 0; j--) {
            let factor = matrix[j][i] * -1;
           
            if (factor == 0) {
                continue;
            }

            matrix[j] = matrix[j].map((element, column) => {
                return element + (factor * matrix[i][column]);
            });
        }
    }

    const inverseMatrix = matrix.map((row) => row.slice(columns));

    return inverseMatrix;

}


function Multiply(matrixA, matrixB) {
    const rowsA = matrixA.length;
    const columnsA = matrixA[0].length;

    const rowsB = matrixB.length;
    const columnsB = matrixB[0].length;

    if (columnsA != rowsB) {
        return null;
    }

    let result = [];

    for (let i = 0; i < rowsA; i++) {
        let row = [];

        for (let j = 0; j < columnsB; j++) {
            let sum = 0;

            for (let k = 0; k < rowsB; k++) {
                sum += matrixA[i][k] * matrixB[k][j];
            }

            row.push(sum);
        }

        result.push(row);
    }

    return result;
}




module.exports = {
    IsSquare,
    GetMatrixShape,
    Gauss,
    Determinant,
    GaussJordan,
    Transpose,
    CofactorMatrix,
    Adjoint,
    Inverse,
    Multiply
}


