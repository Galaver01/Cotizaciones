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

        // ** CONFIGURACIÓN DEL LOGO EN EL PDF (USANDO BASE64) **
                // Pega tu cadena Base64 aquí. Debe comenzar con 'data:image/<tipo>;base64,'.
                // Ejemplo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAABaP246AAAAAXNSR0IArs4c6QAAAyhJREFU...'
                const base64Image = 'data:image/png;base64,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';
                const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAABkCAMAAABDybVbAAABNVBMVEUAAAD18/T7+vr//v7//////v///////v/o493p5uHs6+vi4N/Sz8////+1tLLg2dX08vPBv77IxsWKior7+vqQj467ubh4d3aXlJKlpKNrammenJtRUE80NDQKCgopKSkeHRwAAAAEBAUODw0WFRJYWFc+Pj5ISEgMDQtfX11lZGNxcXCHhoasqqmAf317e3mxsK+Gg4DUrKR+gIF6WxctJBCpfBbmphHkpBBpTxWTbBfKlBhRPxfr2K61hRnkqypUHBKjKhiFZRzqyHvkuFU/LxVzYkhuS0N8JhXIin/8+/vKhHnIf3TLZxbgx7+2QzS5Tz7FdWmzNyeyKxixKBbDcGPNkoe8VkjAZVjbvLLSoJbi0cj9/Pz+/P329fb49/jz8vL8+/v6+fn59/jy8fHl5OXu7e5UjBgvAAAAZ3RSTlMAPIbF3dHn8f///////v////////z//////////v7+/v7+/v7+/v7+/////////v/////+/////////////v///////////////6H//////////////////////6q4SFMulnZoIggVozd+HgAAC1hJREFUeNrtmml32rrWgG8mCPNkjGdp25KNbSAJTTOnPbft6ZS8GYAAIc08/P+f8ErGpMCJb5O298tdfeoW0oXzrL21taXI+dcf/vCH/xHuH+7urq7u7h4e7v9LhoeZ29lvcwvzMcb8wtz59e3F3W923V/dfl2IC8lcMStL5bKkLhdzSSE+f35z9ftMD5ffYkIqW6M6tkwIMKsEaUv1XD52fnv3WyR3NwtCSqbIgAm4z8ROOS3MX8/c/7Jkdj5fUJAJURBaT8a+zvxaum4X8lnNghBTpwRMp6aWXQJgjBJoq8nY7C+kbuZcKNIqcExsY8A5QQMlL6RTGRFDSfaQEYrq+YXLn8zc/U1ssUJgCM3l045VyDSsYqZkIb+GcC6TSBUaGDgGTcevfyqgu2+CqMMImhFSiYqaWcbpjA9VhAwnn19R1AICZAEDS/m5mZ9I2Fy+RIBh2BgAUEJQpHwik8KvMglZzBdRKZMqiCUMKL1sA8P0UvOXL7VczCdcExhYzqcVAixXDVNJLWaR4dWLRdlmCUwrim+ZakZIMBvDTsdvXjZAl7GcAwE2G3Ch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'; // <-- PEGA TU CADENA BASE64 AQUÍ

                const logoWidth = 30;  // Ancho del logo en el PDF (ajusta según sea necesario)
                const logoHeight = 30; // Alto del logo en el PDF (ajusta según sea necesario)
                const logoX = 15;      // Posición X del logo desde el borde izquierdo
                const logoY = 15;      // Posición Y del logo desde el borde superior

                // Añadir el logo al documento PDF
                if (logoBase64) { // Solo añade el logo si la cadena Base64 no está vacía
                    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
                }
                // ** FIN CONFIGURACIÓN DEL LOGO **

        // --- Marca de Agua ELIMINADA ---
        // Se han eliminado las líneas de código para la marca de agua.

        // Encabezado
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("COTIZACIÓN", 105, 25, { align: 'center' });
            
        // Información de empresa
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("NOMBRE COMERCIAL: ANCER SERVICIOS DIESEL", 105, 35, { align: 'center' });
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
        doc.setFillColor(0, 0, 0);
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
        const column2 = 30;
        
        yPos += 8;
        doc.setFont(undefined, 'bold'); // Establece la fuente en negritas
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
