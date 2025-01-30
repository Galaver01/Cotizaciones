document.addEventListener('DOMContentLoaded', () => {
    const productosDiv = document.getElementById('productos');
    const agregarBtn = document.getElementById('agregarProducto');
    const form = document.getElementById('cotizacionForm');
    const previewDiv = document.getElementById('preview');
    const descargarBtn = document.getElementById('descargarPDF');

    function numeroALetras(num) {
        const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
        const especiales = {
            11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
            16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve'
        };
    
        let entero = Math.floor(num);
        let decimal = Math.round((num - entero) * 100);
        let letras = [];
    
        // Manejo de miles (CORREGIDO)
    if (entero >= 1000) {
        const miles = Math.floor(entero / 1000);
        // Extraemos solo la parte de las letras antes de "pesos"
        const letrasMiles = numeroALetras(miles).split(' pesos')[0]; 
        if (miles === 1) letras.push('mil');
        else letras.push(`${letrasMiles} mil`);
        entero %= 1000;
    }
    
        // Centenas
        if (entero >= 100) {
            if (entero === 100) letras.push('cien');
            else letras.push(centenas[Math.floor(entero / 100)]);
            entero %= 100;
        }
    
        // Decenas y unidades
        if (entero > 0) {
            if (especiales[entero]) {
                letras.push(especiales[entero]);
            } else {
                const d = Math.floor(entero / 10);
                const u = entero % 10;
                
                if (d > 0) {
                    letras.push(decenas[d]);
                    if (u > 0 && d > 2) letras.push('y');
                }
                if (u > 0) letras.push(unidades[u]);
            }
        }
    
        // Formateo final
        let resultado = letras.join(' ').trim();
        
        // Manejo de casos especiales
        if (resultado === 'ciento') resultado = 'cien';
        if (resultado.endsWith(' y')) resultado = resultado.slice(0, -2);
        
        // Decimales y sufijo
        const centavos = decimal.toString().padStart(2, '0');
        return `${resultado} pesos ${centavos}/100 M.N.`.replace(/^ /, '').replace(/\s+/g, ' ');
    }

    // Agregar y eliminar productos
    agregarBtn.addEventListener('click', () => {
        const nuevoProducto = document.createElement('div');
        nuevoProducto.className = 'producto';
        nuevoProducto.innerHTML = `
            <input type="text" placeholder="Descripción" class="descripcion" required>
            <input type="number" placeholder="Cantidad" class="cantidad" required>
            <input type="number" placeholder="Precio unitario" class="precio" required>
            <button type="button" class="eliminar">X</button>
        `;
        productosDiv.appendChild(nuevoProducto);
    });

    productosDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('eliminar')) {
            e.target.parentElement.remove();
        }
    });
    // ➕ Nuevo: Selector de IVA
    const ivaSelect = document.createElement('select');
    ivaSelect.innerHTML = `
        <option value="0.16">IVA 16%</option>
        <option value="0.00">Sin IVA</option>
    `;
    form.insertBefore(ivaSelect, form.querySelector('button[type="submit"]'));

    // 🖼️ Función PDF Mejorada
    const generarPDF = (cliente, productos, subtotal, iva, total, fecha) => {
    const doc = new jspdf.jsPDF();
    let yPos = 25;

    
       // Encabezado
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text("COTIZACIÓN", 105, 25, { align: 'center' });
        
        // Información de empresa (posición corregida)
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.text("RYDSA GRUPO DESARROLLADOR INTEGRAL SAS DE CV", 105, 35, { align: 'center' });
    doc.text("RFC: RGD240614SDA", 105, 40, { align: 'center' });
    doc.text("Fco. Javier Alegre 328 Inf. Las Brisas C.P. 91809 Veracruz, Ver", 105, 45, { align: 'center' });

      // Datos cliente (posición ajustada)
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Cliente: ${cliente}`, 15, 60);
    doc.text(`Fecha: ${fecha}`, 15, 65);

    // ➕ NUEVA LEYENDA ANTES DE PRODUCTOS
    yPos = 70;
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Por medio de la presente ponemos a su consideración la siguiente cotización detallando los conceptos siguientes:", 15, yPos);
    yPos += 10; // Espacio después de la leyenda

    // Tabla de productos (espaciado mejorado)
    const headers = ["Descripción", "Cantidad", "P. Unitario", "Subtotal"];
    const columns = [15, 60, 120, 160];
    
    yPos = 75; // Posición inicial ajustada
    doc.setFillColor(44, 62, 80);
    doc.rect(10, yPos, 190, 8, 'F');
    
    // Encabezados de tabla
    doc.setTextColor(255);
    headers.forEach((header, index) => {
        doc.text(header, columns[index], yPos + 6);
    });
    
    // Filas de productos (espaciado aumentado)
    yPos += 12;
    doc.setTextColor(0);
    productos.forEach((item) => {
        if(yPos > 250) { // Salto de página
            doc.addPage();
            yPos = 30;
        }
        
        // Texto con ajuste automático
        const descLines = doc.splitTextToSize(item.descripcion, 40);
        doc.text(descLines, columns[0], yPos);
        doc.text(item.cantidad.toString(), columns[1], yPos);
        doc.text(`$${item.precio.toFixed(2)}`, columns[2], yPos);
        doc.text(`$${(item.cantidad * item.precio).toFixed(2)}`, columns[3], yPos);
        
        yPos += Math.max(12, descLines.length * 8); // Espacio dinámico
    });

    // Totales y leyenda (posición ajustada)
    yPos += 20;
    doc.setFontSize(11);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 150, yPos);
    doc.text(`IVA (${ivaSelect.value * 100}%): $${iva.toFixed(2)}`, 150, yPos + 8);
    doc.setFontSize(13);
    doc.text(`Total: $${total.toFixed(2)}`, 150, yPos + 20);
    
    // Cantidad en letras (centrada)
doc.setFontSize(10);
const textoLetras = `Cantidad con letra: ${numeroALetras(total)}`;
const pageWidth = doc.internal.pageSize.getWidth();
const textWidth = doc.getTextWidth(textoLetras);
doc.text(textoLetras, (pageWidth - textWidth) / 2, yPos + 35);

    // ➕ NUEVA SECCIÓN DE OBSERVACIONES Y DATOS BANCARIOS
    yPos += 45; // Espacio después del total
    
    // Texto en rojo para advertencias
    doc.setFontSize(9);
    doc.setTextColor(255, 0, 0);
    doc.text("* Precios sujetos a cambio sin previo aviso", 15, yPos);
    doc.text("* Según existencia en almacén", 15, yPos + 5);
    doc.text("* Cotización vigente 5 días hábiles", 15, yPos + 10);
    
    // Información bancaria
    yPos += 20;
    doc.setTextColor(0); // Negro
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Información Bancaria para Depósitos y/o Transferencias:", 15, yPos);
    
    // Detalles en dos columnas
    doc.setFont("helvetica", "normal");
    const column1 = 15;
    const column2 = 60;
    
    yPos += 8;
    doc.text("Banco:", column1, yPos);
    doc.text("Banregio", column2, yPos);
    
    yPos += 6;
    doc.text("Cuenta:", column1, yPos);
    doc.text("260934810017", column2, yPos);
    
    yPos += 6;
    doc.text("CLABE:", column1, yPos);
    doc.text("058905000151107860", column2, yPos);
    
    yPos += 6;
    doc.text("Correo:", column1, yPos);
    doc.setTextColor(0, 0, 255); // Azul para email
    doc.textWithLink("admon.rydsa@outlook.com", column2, yPos, { url: "mailto:admon.rydsa@outlook.com" });


    doc.save(`cotizacion_${cliente}.pdf`);
};

    // 🧮 Cálculo de IVA
    const calcularTotales = (productos) => {
        const subtotal = productos.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const iva = subtotal * parseFloat(ivaSelect.value);
        const total = subtotal + iva;
        return { subtotal, iva, total };
    };

    // Evento Submit Actualizado
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cliente = document.getElementById('cliente').value;
        const productos = Array.from(document.querySelectorAll('.producto')).map(producto => ({
            descripcion: producto.querySelector('.descripcion').value,
            cantidad: parseFloat(producto.querySelector('.cantidad').value),
            precio: parseFloat(producto.querySelector('.precio').value)
        }));

        const { subtotal, iva, total } = calcularTotales(productos);
        const fecha = new Date().toLocaleDateString();

        // Vista Previa Mejorada
        previewDiv.innerHTML = `
            <h3>Vista Previa</h3>
            <p>Cliente: ${cliente}</p>
            <p>Fecha: ${fecha}</p>
            <table>
                ${productos.map(item => `
                    <tr>
                        <td>${item.descripcion}</td>
                        <td>${item.cantidad}</td>
                        <td>$${item.precio.toFixed(2)}</td>
                        <td>$${(item.cantidad * item.precio).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="totales">
                <p>Subtotal: $${subtotal.toFixed(2)}</p>
                <p>IVA: $${iva.toFixed(2)}</p>
                <h4>Total: $${total.toFixed(2)}</h4>
            </div>
        `;

        // Conexión PDF
        descargarBtn.style.display = 'block';
        descargarBtn.onclick = () => generarPDF(cliente, productos, subtotal, iva, total, fecha);
    });

    // ... (resto del código sin cambios) ...
});