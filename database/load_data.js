const mysql = require('mysql2/promise');
const fs = require('fs');
const csv = require('csv-parser');

const dbConfig = {
    host: 'localhost',
    user: 'app_user',
    password: 'AppPassword123!',
    database: 'pd_jesus_ariza_clan_cienaga',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function loadData() {
    let connection;
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos MySQL');

        // Leer el archivo CSV
        const results = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream('./sample_data.csv')
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Leídos ${results.length} registros del CSV`);

        // Procesar cada registro
        for (const row of results) {
            try {
                // Extraer dirección
                const addressParts = row.Direccion.split(/(?<=[A-Z]{2}\s\d{5})/);
                const streetAddress = addressParts[0]?.trim() || row.Direccion;
                const cityStateZip = addressParts[1]?.trim() || '';
                
                const cityStateZipParts = cityStateZip.split(/(?<=[A-Z]{2})\s/);
                const city = cityStateZipParts[0]?.trim() || '';
                const stateZip = cityStateZipParts[1]?.trim() || '';
                
                const stateZipParts = stateZip.split(/\s/);
                const state = stateZipParts[0]?.trim() || '';
                const zipCode = stateZipParts[1]?.trim() || '';

                // Extraer teléfono y extensión
                const phoneParts = row.Telefono.split('x');
                const phone = phoneParts[0]?.trim() || row.Telefono;
                const phoneExtension = phoneParts[1]?.trim() || null;

                // Insertar o actualizar cliente
                const [customerResult] = await connection.execute(
                    `INSERT INTO customers (identification_number, first_name, last_name, 
                     street_address, city, state, zip_code, phone, phone_extension, email) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     first_name = VALUES(first_name), last_name = VALUES(last_name),
                     street_address = VALUES(street_address), city = VALUES(city),
                     state = VALUES(state), zip_code = VALUES(zip_code),
                     phone = VALUES(phone), phone_extension = VALUES(phone_extension),
                     email = VALUES(email)`,
                    [
                        row['Numero de Identificacion'],
                        row['Nombre del Cliente'].split(' ')[0] || '',
                        row['Nombre del Cliente'].split(' ').slice(1).join(' ') || '',
                        streetAddress,
                        city,
                        state,
                        zipCode,
                        phone,
                        phoneExtension,
                        row['Correo Electronico']
                    ]
                );

                const customerId = customerResult.insertId || customerResult.insertId;

                // Obtener ID de la plataforma
                const [platformResult] = await connection.execute(
                    'SELECT id FROM payment_platforms WHERE name = ?',
                    [row['Plataforma Utilizada']]
                );

                if (platformResult.length === 0) {
                    console.log(`Plataforma no encontrada: ${row['Plataforma Utilizada']}`);
                    continue;
                }

                const platformId = platformResult[0].id;

                // Determinar estado de la transacción
                let status = 'pending';
                if (parseFloat(row['Monto Pagado']) === 0) {
                    status = 'pending';
                } else if (parseFloat(row['Monto Pagado']) >= parseFloat(row['Monto Facturado'])) {
                    status = 'paid';
                } else {
                    status = 'partial';
                }

                // Insertar transacción
                await connection.execute(
                    `INSERT INTO transactions (invoice_number, customer_id, platform_id, 
                     billing_period, billed_amount, paid_amount, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     billed_amount = VALUES(billed_amount), 
                     paid_amount = VALUES(paid_amount),
                     status = VALUES(status)`,
                    [
                        row['Numero de Factura'],
                        customerId,
                        platformId,
                        row['Periodo de Facturacion'] + '-01',
                        parseFloat(row['Monto Facturado']),
                        parseFloat(row['Monto Pagado']),
                        status
                    ]
                );

                console.log(`Procesado: ${row['Nombre del Cliente']} - ${row['Numero de Factura']}`);

            } catch (error) {
                console.error(`Error procesando registro: ${row['Nombre del Cliente']}`, error.message);
            }
        }

        console.log('Carga de datos completada exitosamente');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Conexión cerrada');
        }
    }
}

// Ejecutar el script
loadData(); 