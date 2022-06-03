const mysql = require('mysql2/promise');

const conn = async () => {
	return await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'leads'
	});
}

const getNumber = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('SELECT number FROM clientes WHERE number = ?', [number]);
	if (rows.length > 0) return rows[0].number;
	return false;
}

const setNumber = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('INSERT INTO clientes SET number = ?', [number]);
	if (rows.length > 0) return rows[0].number;
	return false;
}

const delNumber = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('DELETE FROM clientes WHERE number = ?', [number]);
	if (rows.length > 0) return rows[0].number;
	return false;
}

const getUser = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('SELECT number, email, accept, created_At, update_At FROM clientes WHERE number = ?', [number]);
	if (rows.length > 0) return [rows[0].number, rows[0].email, rows[0].accept, rows[0].created_At, rows[0].update_At];
	return false;
}

const getAccept = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('SELECT accept FROM clientes WHERE number = ?', [number]);
	if (rows.length > 0) return rows[0].accept;
	return false;
}

const setAccept = async (accept, number) => {
	const connection = await conn();
	const [rows] = await connection.execute(
		'UPDATE clientes SET accept = ?, update_At = now() WHERE number = ?', [accept, number]
	);
	if (rows.length > 0) return rows[0].accept;
	return false;
}

const getEmail = async (number) => {
	const connection = await conn();
	const [rows] = await connection.execute('SELECT email FROM clientes WHERE number = ?', [number]);
	if (rows.length > 0) return rows[0].email;
	return false;
}

const setEmail = async (email, number) => {
	const connection = await conn();
	const [rows] = await connection.execute(
		'UPDATE clientes SET email = ?, update_At = now() WHERE number = ?', [email, number]
	);
	if (rows.length > 0) return rows[0].email;
	return false;
}

const updateEmail = async (email, number) => {
	const connection = await conn();
	const [rows] = await connection.execute(
		'UPDATE clientes SET email = ?, update_At = now() WHERE number = ?', [email, number]
	);
	if (rows.length > 0) return rows[0].email;
	return false;
}

const getAnswer = async (question) => {
	const connection = await conn();
	const [rows] = await connection.execute('SELECT answer FROM bot WHERE question = ?', [question]);
	if (rows.length > 0) return rows[0].answer;
	return false;
}


module.exports = {
	conn,
	getAnswer,
	setNumber,
	getNumber,
	getUser,
	setEmail,
	getEmail,
	updateEmail,
	delNumber,
	getAccept,
	setAccept
}