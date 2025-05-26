document.addEventListener('DOMContentLoaded', () => {
    const productosDiv = document.getElementById('productos');
    const agregarBtn = document.getElementById('agregarProducto');
    const form = document.getElementById('cotizacionForm');
    const previewDiv = document.getElementById('preview');
    const descargarBtn = document.getElementById('descargarPDF');
    const aplicarISRCheckbox = document.getElementById('aplicarISR'); // Referencia al checkbox

    // Función para convertir números a letras
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
    
        if (entero >= 1000) {
            const miles = Math.floor(entero / 1000);
            const letrasMiles = numeroALetras(miles).split(' pesos')[0]; 
            if (miles === 1) letras.push('mil');
            else letras.push(`${letrasMiles} mil`);
            entero %= 1000;
        }
    
        if (entero >= 100) {
            if (entero === 100) letras.push('cien');
            else letras.push(centenas[Math.floor(entero / 100)]);
            entero %= 100;
        }
    
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
    
        let resultado = letras.join(' ').trim();
        
        if (resultado === 'ciento') resultado = 'cien';
        if (resultado.endsWith(' y')) resultado = resultado.slice(0, -2);
        
        const centavos = decimal.toString().padStart(2, '0');
        return `${resultado} pesos ${centavos}/100 M.N.`.replace(/^ /, '').replace(/\s+/g, ' ');
    }

    // Agregar y eliminar productos
    agregarBtn.addEventListener('click', () => {
        const nuevoProducto = document.createElement('div');
        nuevoProducto.className = 'producto';
        nuevoProducto.innerHTML = `
            <input type="text" placeholder="Economico trabajado" class="economico" required>
            <input type="date" placeholder="Fecha de trabajo" class="fecha" required>
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

    // Selector de IVA
    const ivaSelect = document.createElement('select');
    ivaSelect.innerHTML = `
        <option value="0.16">IVA 16%</option>
        <option value="0.00">Sin IVA</option>
    `;
    form.insertBefore(ivaSelect, form.querySelector('button[type="submit"]'));

    // Función para generar el PDF
    const generarPDF = (cliente, productos, subtotal, iva, isr, total, fecha) => { 
        const doc = new jspdf.jsPDF();
        let yPos = 25;

        // --- Marca de Agua ELIMINADA ---
        // Se han eliminado las líneas de código para la marca de agua.

        // Encabezado
        doc.setFontSize(14);
        doc.setTextColor(44, 62, 80);
        doc.setFont("helvetica", "bold");
        doc.text("COTIZACIÓN", 105, 25, { align: 'center' });
            
        // Información de empresa
        doc.setFontSize(9);
        doc.setTextColor(127, 140, 141);
        doc.text("NOMBRE COMERCIAL: ANCER SISTEMAS DIESEL", 105, 35, { align: 'center' });
        doc.text("RAZON SOCIAL: LESSIA JUDITH SANTIAGO DIAZ", 105, 40, { align: 'center' });
        doc.text("RFC: SADL051012SF7", 105, 45, { align: 'center' });

        // Datos cliente
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`Cliente: ${cliente}`, 15, 60);
        doc.text(`Fecha: ${fecha}`, 15, 65);

        // Leyenda antes de productos
        yPos = 70;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Por medio de la presente ponemos a su consideración la siguiente cotización detallando los conceptos siguientes:", 15, yPos);
        yPos += 10;

        // Tabla de productos
        const headers = ["Eco", "Fecha de trabajo", "Descripción", "Cantidad", "P. Unitario", "Subtotal"];
        const columns = [10, 35, 70, 130, 155, 180]; 
        
        yPos = 75; 
        doc.setFillColor(44, 62, 80);
        doc.rect(10, yPos, 190, 8, 'F');
        
        doc.setTextColor(255);
        headers.forEach((header, index) => {
            doc.text(header, columns[index], yPos + 6);
        });
        
        yPos += 12;
        doc.setTextColor(0);
        productos.forEach((item) => {
            if(yPos > 250) { 
                doc.addPage();
                // Se ha eliminado la adición de la marca de agua en nuevas páginas
                yPos = 30; 
            }
            
            const descLines = doc.splitTextToSize(item.descripcion, 55); 
            doc.text(item.economico, columns[0], yPos);
            doc.text(item.fecha, columns[1], yPos);     
            doc.text(descLines, columns[2], yPos);
            doc.text(item.cantidad.toString(), columns[3], yPos);
            doc.text(`$${item.precio.toFixed(2)}`, columns[4], yPos);
            doc.text(`$${(item.cantidad * item.precio).toFixed(2)}`, columns[5], yPos);
            
            yPos += Math.max(12, descLines.length * 8);
        });

        // Totales y leyenda
        yPos += 20;
        doc.setFontSize(11);
        doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 150, yPos);
        doc.text(`IVA (${ivaSelect.value * 100}%): $${iva.toFixed(2)}`, 150, yPos + 8);
        
        if (isr > 0) { 
            doc.text(`ISR: -$${isr.toFixed(2)}`, 150, yPos + 16); 
            doc.setFontSize(13);
            doc.text(`Total: $${total.toFixed(2)}`, 150, yPos + 24); 
            doc.setFontSize(10);
            const textoLetras = `Cantidad con letra: ${numeroALetras(total)}`;
            const pageWidthForText = doc.internal.pageSize.getWidth();
            const textWidth = doc.getTextWidth(textoLetras);
            doc.text(textoLetras, (pageWidthForText - textWidth) / 2, yPos + 39); 
        } else { 
            doc.setFontSize(13);
            doc.text(`Total: $${total.toFixed(2)}`, 150, yPos + 16); 
            doc.setFontSize(10);
            const textoLetras = `Cantidad con letra: ${numeroALetras(total)}`;
            const pageWidthForText = doc.internal.pageSize.getWidth();
            const textWidth = doc.getTextWidth(textoLetras);
            doc.text(textoLetras, (pageWidthForText - textWidth) / 2, yPos + 31); 
        }

        // Sección de observaciones y datos bancarios
        yPos += 45; 
        
        doc.setFontSize(9);
        doc.setTextColor(255, 0, 0);
        doc.text("* Precios sujetos a cambio sin previo aviso", 15, yPos);
        doc.text("* Pago de contado", 15, yPos + 5);
        doc.text("* Cotización vigente 5 días hábiles", 15, yPos + 10);
        
        yPos += 20;
        doc.setTextColor(0); 
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Información Bancaria ", 15, yPos);
        
        doc.setFont("helvetica", "normal");
        const column1 = 15;
        const column2 = 60;
        
        yPos += 8;
        doc.text("Banco:", column1, yPos);
        doc.text("BANCOMER BBVA", column2, yPos);
        
        yPos += 6;
        doc.text("Cuenta:", column1, yPos);
        doc.text("1536852980", column2, yPos);
        
        yPos += 6;
        doc.text("CLABE:", column1, yPos);
        doc.text("012 180 01536852980 9", column2, yPos);
        
        yPos += 6;
        doc.text("Correo:", column1, yPos);
        doc.setTextColor(0, 0, 255);
        doc.textWithLink("ancer_serviciosdiesel@outlook.com", column2, yPos, { url: "mailto:ancer_serviciosdiesel@outlook.com" });

        doc.save(`cotizacion_${cliente}.pdf`);
    };

    // Cálculo de IVA y AHORA ISR
    const calcularTotales = (productos) => {
        const subtotal = productos.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
        const iva = subtotal * parseFloat(ivaSelect.value);
        
        let isr = 0; 
        if (aplicarISRCheckbox.checked) {
            const isrRate = 0.0125; 
            isr = subtotal * isrRate;
        }

        const total = subtotal + iva - isr; 
        
        return { subtotal, iva, isr, total }; 
    };

    // Evento Submit Actualizado
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cliente = document.getElementById('cliente').value;
        const productos = Array.from(document.querySelectorAll('.producto')).map(producto => ({
            economico: producto.querySelector('.economico').value,
            fecha: producto.querySelector('.fecha').value,
            descripcion: producto.querySelector('.descripcion').value,
            cantidad: parseFloat(producto.querySelector('.cantidad').value),
            precio: parseFloat(producto.querySelector('.precio').value)
        }));

        const { subtotal, iva, isr, total } = calcularTotales(productos); 
        const fecha = new Date().toLocaleDateString();

        // Vista Previa Mejorada
        previewDiv.innerHTML = `
            <h3>Vista Previa</h3>
            <p>Cliente: ${cliente}</p>
            <p>Fecha: ${fecha}</p>
            <table>
                <thead>
                    <tr>
                        <th>Economico trabajado</th>
                        <th>Fecha de trabajo</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>P. Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(item => `
                        <tr>
                            <td>${item.economico}</td>
                            <td>${item.fecha}</td>
                            <td>${item.descripcion}</td>
                            <td>${item.cantidad}</td>
                            <td>$${item.precio.toFixed(2)}</td>
                            <td>$${(item.cantidad * item.precio).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="totales">
                <p>Subtotal: $${subtotal.toFixed(2)}</p>
                <p>IVA: $${iva.toFixed(2)}</p>
                ${isr > 0 ? `<p>Retención ISR (1.25%): -$${isr.toFixed(2)}</p>` : ''} 
                <h4>Total: $${total.toFixed(2)}</h4>
            </div>
        `;

        // Conexión PDF - Pasamos el ISR como parámetro
        descargarBtn.style.display = 'block';
        descargarBtn.onclick = () => generarPDF(cliente, productos, subtotal, iva, isr, total, fecha);
    });
});
