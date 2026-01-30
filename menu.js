// URL del CSV de Google Sheets (Publicat al web)
// INSTRUCCIONS:
// 1. Crea un Google Sheet amb les columnes: Categoria, Nom, Preu, Descripcio
// 2. Ves a Fitxer > Comparteix > Publica al web
// 3. Tria "Tot el document" i format "Valors separats per comes (.csv)"
// 4. Copia l'enllaç i enganxa'l aquí sota:
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZHpglvcukVVQyif7g7JpWOyOkQbkXEfYDVBA3kmmIsdsVkryI7kypKTR3bhsq-UXsjBnUGeJw6mtr/pub?output=csv';

async function fetchMenu() {
    // Check if the URL is the default placeholder or empty
    if (!SHEET_URL || SHEET_URL === 'INSERT_YOUR_GOOGLE_SHEET_CSV_URL_HERE') {
        console.warn('Google Sheet URL not set. Using fallback data.');
        return [];
    }

    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    // Assuming First Row is Header. We skip it, or valid if strict format.
    // Order: Categoria, Nom, Preu, Descripcio

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        // Handle quotes in CSV (basic parser)
        const row = [];
        let inQuote = false;
        let currentCell = '';

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        row.push(currentCell.trim());

        if (row.length < 3) continue; // Skip malformed rows

        // Map row to object based on expected column order (Categoria, Nom, Preu, Descripcio)
        result.push({
            id: i,
            category: row[0] || 'Altres',
            name: row[1] || '',
            price: row[2] || '',
            description: row[3] || ''
        });
    }
    return result;
}

// Render Public Menu
async function renderPublicMenu() {
    const container = document.getElementById('menu-container');
    const navContainer = document.querySelector('.menu-categories-nav');

    if (!container) return;

    let menuItems = await fetchMenu();
    let isFallback = false;

    if (menuItems.length === 0) {
        // Fallback: If no sheet content, we have to show something or nothing.
        // For this delivery, I will insert the STATIC MENU DATA we had before 
        // as a "hardcoded fallback" so the site isn't empty until they connect the sheet.
        menuItems = STATIC_FALLBACK_DATA;
        isFallback = true;
    }

    // Dynamic Grouping
    // We maintain the order of categories as they appear in the data
    const categories = [];
    const groupedItems = {};

    menuItems.forEach(item => {
        // Normalize category name for grouping key
        const catKey = item.category;
        if (!categories.includes(catKey)) {
            categories.push(catKey);
            groupedItems[catKey] = [];
        }
        groupedItems[catKey].push(item);
    });

    container.innerHTML = '';

    // Build Navigation Links
    if (navContainer) {
        navContainer.innerHTML = categories.map(cat => {
            // Create a safe ID string for anchor (remove spaces, special chars)
            const safeId = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
            return `<a href="#${safeId}" class="cat-link">${cat}</a>`;
        }).join('');
    }

    // Build Sections
    categories.forEach(cat => {
        const safeId = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const items = groupedItems[cat];

        const section = document.createElement('section');
        section.id = safeId;
        section.className = 'menu-section';

        section.innerHTML = `
            <h2 class="category-title">${cat}</h2>
            <div class="menu-items-grid">
                ${items.map(item => `
                    <div class="menu-item">
                        <div class="item-content">
                            <div class="item-header">
                                <span class="item-title">${item.name}</span>
                                <span class="item-price">${item.price}</span>
                            </div>
                            <p class="item-desc">${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(section);
    });

    setupScrollSpy();
}

function setupScrollSpy() {
    const navLinks = document.querySelectorAll('.cat-link');
    const sections = document.querySelectorAll('.menu-section');
    const navContainer = document.querySelector('.menu-categories-nav');
    if (!navContainer) return;

    // Smooth scroll for clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href.length > 1) {
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    const offsetPosition = targetSection.offsetTop - 160;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // Scroll Spy
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.pageYOffset + 200;

        sections.forEach(section => {
            if (section.offsetTop <= scrollPosition) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href.substring(1) === current) {
                link.classList.add('active');

                const linkRect = link.getBoundingClientRect();
                const navRect = navContainer.getBoundingClientRect();

                if (linkRect.left < navRect.left || linkRect.right > navRect.right) {
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        });
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('menu-container')) {
        renderPublicMenu();
    }
});

// --- STATIC FALLBACK DATA (Used if no Sheet is connected) ---
// This ensures the site works 'out of the box' with the data you gave me
// until the owner connects their sheet.
const STATIC_FALLBACK_DATA = [
    // A L’HORA DEL VERMUT (1)
    { category: 'A l’hora del Vermut', name: 'Vermut de Cercs negre Macarrilla', price: '4,00 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Vermut de Cercs blanc Macarrilla', price: '4,00 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Vermut de Cercs de taronja Macarrilla', price: '4,00 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Martini blanc o negre', price: '3,50 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Vermut de Reus Iris', price: '4,50 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Aperol spritz', price: '8,00 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Bossa de patates lays', price: '1,60 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Olives farcides', price: '4,00 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Escopinyes', price: '8,50 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Musclos', price: '5,70 €', description: '' },
    { category: 'A l’hora del Vermut', name: 'Navalles', price: '6,90 €', description: '' },

    // TAPES (2)
    { category: 'Tapes', name: 'Nachos amb formatge cheddar', price: '4,00 €', description: '' },
    { category: 'Tapes', name: 'Nachos amb guacamole', price: '4,00 €', description: '' },
    { category: 'Tapes', name: 'Nachos amb guacamole i cheddar', price: '5,00 €', description: '' },
    { category: 'Tapes', name: 'Formatge semi curat', price: '8,50 €', description: '' },
    { category: 'Tapes', name: 'Pernil ibèric i pa amb tomàquet', price: '12,00 €', description: '' },
    { category: 'Tapes', name: 'Tendal d’anxoves (6 unitats)', price: '10,00 €', description: '' },
    { category: 'Tapes', name: 'Combo de crispy tender', price: '12,00 €', description: '' },
    { category: 'Tapes', name: 'Combo aletes de pollastre a l’estil KFC', price: '12,00 €', description: '' },
    { category: 'Tapes', name: 'Calamars a la Romana', price: '8,50 €', description: '' },
    { category: 'Tapes', name: 'Patates braves', price: '4,70 €', description: '' },
    { category: 'Tapes', name: 'Les braves de la Joana de l’antic Frankfurt Gironella', price: '6,00 €', description: '' },
    { category: 'Tapes', name: 'Patates braves de l’Oriol Rovira dels Casals', price: '6,00 €', description: '' },
    { category: 'Tapes', name: 'Patates fregides', price: '3,50 €', description: '' },
    { category: 'Tapes', name: 'Pop de muntanya a la gallega', price: '7,00 €', description: '' },
    { category: 'Tapes', name: 'Anelles de ceba', price: '6,00 €', description: '' },
    { category: 'Tapes', name: 'Fingers de pollastre', price: '6,00 €', description: '' },
    { category: 'Tapes', name: 'Tapa de llonganissa', price: '7,00 €', description: '' },
    { category: 'Tapes', name: 'Croquetes de rostit (5 unitats)', price: '6,00 €', description: '' },
    { category: 'Tapes', name: 'Nugget de pollastre', price: '6,30 €', description: '' },
    { category: 'Tapes', name: 'Pa bao amb roast beef i salsa parrilla', price: '3,00 €/u.', description: '' },
    { category: 'Tapes', name: 'Aletes de pollastre', price: '5,80 €', description: '' },
    { category: 'Tapes', name: 'Pintxos de casa Figols amb patates', price: '9,00 €', description: '' },

    // AMANIDES (3)
    { category: 'Amanides', name: 'Amanida de formatge de cabra', price: '9,00 €', description: '' },
    { category: 'Amanides', name: 'Amanida verda amb tonyina', price: '7,50 €', description: '' },

    // PLATS COMBINATS (4)
    { category: 'Plats Combinats', name: 'Cal Bassacs', price: '12,50 €', description: 'Sípia amb patates fregides i amanida' },
    { category: 'Plats Combinats', name: 'Gironella', price: '10,50 €', description: 'Ous, bacó, patates' },
    { category: 'Plats Combinats', name: 'Cal Blau', price: '11,50 €', description: '4 talls de llom a la planxa, 3 croquetes de rostit, patates i allioli' },
    { category: 'Plats Combinats', name: 'Cal Ramons', price: '13,50 €', description: 'Bistec de vedella amb patates i amanida' },
    { category: 'Plats Combinats', name: 'Viladomiu Nou', price: '13,50 €', description: 'Calamars a la romana, amanida amb formatge de cabra, escalivada, patates' },
    { category: 'Plats Combinats', name: 'Viladomiu Vell', price: '10,50 €', description: 'Hamburguesa mixta, ou, bacó i patates' },
    { category: 'Plats Combinats', name: 'La Font dels Torracs', price: '18,00 €', description: 'Entrecot de vedella amb escalivada i patates' },
    { category: 'Plats Combinats', name: 'Cap del Pla', price: '10,50 €', description: 'Botifarra amb ous ferrats i patates' },
    { category: 'Plats Combinats', name: 'Barri Vell', price: '10,50 €', description: 'Pit de pollastre a la planxa, escalivada i amanida' },

    // PLATS (5)
    { category: 'Plats', name: 'Costella de porc a baixa temperatura', price: '15,00 €', description: '' },
    { category: 'Plats', name: 'Taula d’embotits', price: '19,00 €', description: '' },
    { category: 'Plats', name: 'Callos', price: '8,00 €', description: '' },
    { category: 'Plats', name: 'Risotto de bolets', price: '8,00 €', description: '' },
    { category: 'Plats', name: 'Mandonguilles amb tomàquet', price: '7,80 €', description: '' },
    { category: 'Plats', name: 'Burrito de pollastre, guacamole i llima', price: '7,00 €', description: '' },

    // HAMBURGUESES (6)
    { category: 'Hamburgueses', name: 'Hamburguesa de pollastre amb cornflake', price: '5,60 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa moruna', price: '5,20 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa picant', price: '5,20 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa clàssica', price: '5,20 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa vegana', price: '5,20 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa de pollastre', price: '5,20 €', description: 'Pa Rodó' },
    { category: 'Hamburgueses', name: 'Hamburguesa BLACK ANGUSS', price: '8,70 €', description: 'Pa Rodó' },
    // Extras (added under Hamburgueses for context)
    { category: 'Hamburgueses', name: 'Extra: Bacon', price: '1,00 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Formatge', price: '0,80 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Form. cabra', price: '1,80 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Pernil dolç', price: '0,60 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Ceba', price: '0,70 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Ou ferrat', price: '1,20 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Enciam', price: '0,60 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Pernil salat', price: '1,80 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Pebrot', price: '0,70 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Tomaquet', price: '0,60 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Tonyina', price: '1,30 €', description: '' },
    { category: 'Hamburgueses', name: 'Extra: Salsa', price: '1,00 €', description: '' },

    // FRANKFURT (7)
    { category: 'Frankfurt', name: 'Frankfurt', price: '3,80 € / 4,80 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Frankfurt picant', price: '3,80 € / 4,80 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Cervela', price: '3,90 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Bratwurst', price: '3,90 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Bikini', price: '4,20 € / 5,60 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Bikini pernil salat', price: '4,60 € / 6,00 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Frankfurt', name: 'Bikini tonyina', price: '4,70 €', description: '' },
    { category: 'Frankfurt', name: 'Bikini de pernil ibèric', price: '6,70 €', description: '' },
    { category: 'Frankfurt', name: 'Bikini de pernil i bacó', price: '5,30 €', description: '' },
    { category: 'Frankfurt', name: 'Bikini de formatge', price: '5,10 €', description: '' },

    // ENTREPANS CALENTS (8)
    { category: 'Entrepans Calents', name: 'Bacó', price: '3,50 € / 4,80 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Llom', price: '3,60 € / 4,90 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Salsitxa país', price: '3,50 € / 4,80 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Botifarra de la casa', price: '3,80 € / 4,90 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Salsitxa moruna', price: '3,40 € / 3,60 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Botifarra negre', price: '3,60 € / 5,60 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Pit de pollastre', price: '3,50 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Truita francesa', price: '3,40 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Serranito', price: '4,70 € / 6,90 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Cansalada', price: '3,70 € / 5,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Xistorra', price: '3,60 € / 4,60 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Calents', name: 'Vegetal de pollastre', price: '7,30 €', description: '' },
    { category: 'Entrepans Calents', name: 'Vegetal de tonyina', price: '7,30 €', description: '' },
    { category: 'Entrepans Calents', name: 'Pintxo de Casa Figols', price: '3,70 € / 5,30 €', description: '' },

    // ENTREPANS FREDS (9)
    { category: 'Entrepans Freds', name: 'Llonganissa', price: '3,40 € / 4,80 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Pernil salat de bodega', price: '3,80 € / 4,90 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Pernil ibèric', price: '5,80 € / 8,50 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Pernil dolç', price: '3,80 € / 4,50 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Bull blanc', price: '3,80 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Formatge crema', price: '3,40 € / 4,70 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Anxoves 6u', price: '9,00 €', description: '' },
    { category: 'Entrepans Freds', name: 'Tonyina', price: '3,60 € / 5,00 €', description: 'Pa de Frankfurt / Pa de barra' },
    { category: 'Entrepans Freds', name: 'Xoriç', price: '3,20 € / 4,20 €', description: 'Pa de Frankfurt / Pa de barra' },

    // TORRADES (10)
    { category: 'Torrades', name: 'Torrada de bacó amb formatge', price: '7,30 €', description: '' },
    { category: 'Torrades', name: 'Torrada de botifarra', price: '7,30 €', description: '' },
    { category: 'Torrades', name: 'Torrada de llom i formatge', price: '7,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada de pernil ibèric', price: '11,00 €', description: '' },
    { category: 'Torrades', name: 'Torrada de pernil salat de bodega', price: '7,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada d’escalivada amb anxoves', price: '9,00 €', description: '' },
    { category: 'Torrades', name: 'Torrada de truita de patates amb ceba', price: '7,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada de cansalada', price: '7,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada d’anxoves (6 unitats)', price: '9,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada de truita francesa', price: '6,50 €', description: '' },
    { category: 'Torrades', name: 'Torrada de tonyina', price: '8,00 €', description: '' },

    // POSTRES (11)
    { category: 'Postres', name: 'Coulant de xocolata', price: '4,60 €', description: '' },
    { category: 'Postres', name: 'Coulant de xocolata blanca', price: '4,60 €', description: '' },
    { category: 'Postres', name: 'Pastís Lotus', price: '5,00 €', description: '' },
    { category: 'Postres', name: 'Pastís de formatge', price: '4,60 €', description: '' },
    { category: 'Postres', name: 'Púding casolà', price: '4,60 €', description: '' },
    { category: 'Postres', name: 'Trufes de xocolata amb nata', price: '4,50 €', description: '' },
    { category: 'Postres', name: 'Crep de xocolata', price: '4,80 €', description: '' },
    { category: 'Postres', name: 'Mousse de llimona', price: '4,50 €', description: '' },
    { category: 'Postres', name: 'Bikini de Nutella', price: '4,50 €', description: '' },

    // CAFÈS (12)
    { category: 'Cafès', name: 'Cafè', price: '1,35 €', description: '' },
    { category: 'Cafès', name: 'Tallat', price: '1,45 €', description: 'Llet avena, llet sense lactosa' },
    { category: 'Cafès', name: 'Tallat condensada', price: '1,45 €', description: '' },
    { category: 'Cafès', name: 'Cafè amb llet', price: '1,60 €', description: '' },
    { category: 'Cafès', name: 'Cafè amb llet beguda de civada/soja', price: '1,70 €', description: '' },
    { category: 'Cafès', name: 'Cigaló de conyac', price: '2,00 €', description: '' },
    { category: 'Cafès', name: 'Cigaló de whisky', price: '2,60 €', description: '' },
    { category: 'Cafès', name: 'Cigaló d’anís', price: '2,00 €', description: '' },
    { category: 'Cafès', name: 'Capuccino', price: '1,80 €', description: '' },
    { category: 'Cafès', name: 'Cafè vienès', price: '2,20 €', description: '' },
    { category: 'Cafès', name: 'Trifàsic de conyac', price: '2,00 €', description: '' },
    { category: 'Cafès', name: 'Trifàsic de whisky', price: '2,10 €', description: '' },
    { category: 'Cafès', name: 'Trifàsic d’anís', price: '1,90 €', description: '' },
    { category: 'Cafès', name: 'Cafè descafeïnat', price: '1,30 €', description: '' },
    { category: 'Cafès', name: 'Tallat descafeïnat de màquina', price: '1,40 €', description: '' },
    { category: 'Cafès', name: 'Tallat descafeïnat de sobre', price: '1,40 €', description: '' },
    { category: 'Cafès', name: 'Cola cao', price: '1,70 €', description: '' },
    { category: 'Cafès', name: 'Got de llet', price: '1,40 €', description: '' },
    { category: 'Cafès', name: 'Cafè amb llet XL', price: '1,80 €', description: '' },
    { category: 'Cafès', name: 'Infusions', price: '1,50 €', description: '' },
    { category: 'Cafès', name: 'Cacaolat (Cafeteria)', price: '2,30 €', description: '' },
    { category: 'Cafès', name: 'Cafè americà', price: '1,40 €', description: '' },
    { category: 'Cafès', name: 'Cafè doble', price: '1,60 €', description: '' },
    { category: 'Cafès', name: 'Cafè irlandès', price: '6,00 €', description: '' },

    // VINS (13)
    { category: 'Vins', name: 'Ampolla vi de la casa (Blanc)', price: '1,90 € / 7,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Marieta (albariño)', price: '3,50 € / 16,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Alba d’Abadal (Pla de Bages)', price: '3,00 € / 15,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Quinta de Couselo (o rosal)', price: '3,50 € / 16,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Ampolla vi de la casa (Negre)', price: '1,90 € / 7,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Gran foc (Penedès)', price: '3,00 € / 16,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Cillar de Silos (Ribera del Duero)', price: '3,50 € / 16,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Vallobera criança (Rioja)', price: '3,50 € / 16,00 €', description: 'Copa / Ampolla' },
    { category: 'Vins', name: 'Sangria de cava', price: '13,50 €', description: '' },
    { category: 'Vins', name: 'Sangria de vi', price: '11,00 €', description: '' },

    // CERVESES (14)
    { category: 'Cerveses', name: 'Cervesa de llauna', price: '2,00 €', description: '' },
    { category: 'Cerveses', name: 'Cervesa sense gluten', price: '2,20 €', description: '' },
    { category: 'Cerveses', name: '1906 black', price: '2,55 €', description: '' },
    { category: 'Cerveses', name: 'Galicia torrada', price: '2,05 €', description: '' },
    { category: 'Cerveses', name: 'Cervesa 0,0', price: '2,05 €', description: '' },
    { category: 'Cerveses', name: 'Mitjana estrella galicia', price: '1,85 €', description: '' },
    { category: 'Cerveses', name: 'Zurito cervesa', price: '1,55 €', description: '' },
    { category: 'Cerveses', name: 'Copa torrada 0,0', price: '2,10 €', description: '' },
    { category: 'Cerveses', name: 'Copa de cervesa estrella galicia', price: '1,90 €', description: '' },
    { category: 'Cerveses', name: 'Copa de cervesa 1906', price: '2,10 €', description: '' },
    { category: 'Cerveses', name: 'Canya petita estrella galicia', price: '1,55 €', description: '' },
    { category: 'Cerveses', name: 'Canya petita 1906', price: '1,90 €', description: '' },
    { category: 'Cerveses', name: 'Canya torrada 0,0', price: '2,00 €', description: '' },
    { category: 'Cerveses', name: 'Clara copa', price: '2,20 €', description: '' },
    { category: 'Cerveses', name: 'Canya clara petita', price: '1,80 €', description: '' },
    { category: 'Cerveses', name: 'Radler llimona', price: '2,05 €', description: '' },
    { category: 'Cerveses', name: 'Gerra petita cervesa', price: '2,25 €', description: '' },
    { category: 'Cerveses', name: 'Gerra petita clara', price: '2,35 €', description: '' },
    { category: 'Cerveses', name: 'Gerra petita torrada', price: '2,35 €', description: '' },
    { category: 'Cerveses', name: 'Gerra petita 1906', price: '2,55 €', description: '' },
    { category: 'Cerveses', name: 'Gerra mig clara', price: '3,00 €', description: '' },
    { category: 'Cerveses', name: 'Gerra gran cervesa', price: '3,45 €', description: '' },
    { category: 'Cerveses', name: 'Gerra gran clara', price: '3,25 €', description: '' },
    { category: 'Cerveses', name: 'Gerra gran torrada', price: '3,35 €', description: '' },
    { category: 'Cerveses', name: 'Gerra gran 1906', price: '3,80 €', description: '' },
    { category: 'Cerveses', name: 'Quinto d’estrella galicia', price: '1,70 €', description: '' },

    // REFRESCOS LLAUNA (15)
    { category: 'Refrescos Llauna', name: 'Coca cola', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Coca cola zero', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Fanta de taronja', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Fanta de llimona', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Aquarius', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Nestea', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Sprite', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Pepsi llauna', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Pepsi 35 cl', price: '2,20 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Kas 35 cl', price: '2,20 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Trina taronja', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Trina poma', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Aquarade', price: '2,00 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Aigua Cabreiroá 50 cl', price: '1,50 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Aigua Cabreiroá 1,5 l', price: '2,50 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Royal bliss', price: '1,90 €', description: '' },
    { category: 'Refrescos Llauna', name: 'Vichy', price: '1,85 €', description: '' },

    // REFRESCOS I VARIS (16)
    { category: 'Refrescos i Varis', name: 'Cacaolat', price: '2,40 €', description: '' },
    { category: 'Refrescos i Varis', name: 'Coca cola 237 ml', price: '1,80 €', description: '' },
    { category: 'Refrescos i Varis', name: 'Bitter kas', price: '2,50 €', description: '' },
    { category: 'Refrescos i Varis', name: 'Sucs', price: '1,70 €', description: '' },
    { category: 'Refrescos i Varis', name: 'Gaseosa de 1/2', price: '1,80 €', description: '' },

    // GIN TONICS (17)
    { category: 'Gin Tonics', name: 'Seagrams amb tònica', price: '7,00 €', description: '' },
    { category: 'Gin Tonics', name: 'Beefeater amb tònica', price: '7,00 €', description: '' },
    { category: 'Gin Tonics', name: 'Gvine amb tònica', price: '8,50 €', description: '' },
    { category: 'Gin Tonics', name: 'Bombay amb tònica', price: '7,00 €', description: '' },
    { category: 'Gin Tonics', name: 'Bulldog amb tònica', price: '8,50 €', description: '' },
    { category: 'Gin Tonics', name: 'Puertos de indias amb tònica', price: '7,00 €', description: '' },

    // RON (18)
    { category: 'Ron', name: 'Ron bacardi amb cola', price: '6,00 €', description: '' },
    { category: 'Ron', name: 'Ron havanna 7 amb cola', price: '8,00 €', description: '' },
    { category: 'Ron', name: 'Ron barceló amb cola', price: '7,00 €', description: '' },

    // LICORS (19)
    { category: 'Licors', name: 'Anís', price: '2,30 € / 1,50 €', description: 'Copa / Raig / Tub Gel / Xarrup' },
    { category: 'Licors', name: 'Magno', price: '2,50 € / 1,20 €', description: '' },
    { category: 'Licors', name: 'Veterano', price: '2,50 € / 1,20 €', description: '' },
    { category: 'Licors', name: 'JB', price: '2,70 € / 1,60 € / 3,70 € / 2,00 €', description: '' },
    { category: 'Licors', name: 'Ballantines', price: '3,00 € / 1,50 € / 4,50 € / 2,00 €', description: '' },
    { category: 'Licors', name: 'Baileys', price: '3,00 € / 1,50 € / 3,50 € / 2,00 €', description: '' },
    { category: 'Licors', name: 'Crema orujo', price: '3,00 € / 1,50 € / 4,00 € / 2,00 €', description: '' },
    { category: 'Licors', name: 'Licor herbes', price: '3,00 € / 1,50 € / 3,75 € / 2,00 €', description: '' },
    { category: 'Licors', name: 'Licor poma i préssec', price: '2,00 € / 1,50 € / 3,75 € / 2,00 €', description: '' },
];
