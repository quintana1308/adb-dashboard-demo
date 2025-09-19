import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import ExcelExportButton from '../ExcelExportButton';
import RefreshWidgetButton from '../RefreshWidgetButton';
import veSvgUrl from '../../assets/ve.svg';

const MapaVenezuelaWidget = ({ filtros, forceRefresh, onFiltroInternoChange }) => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [posicionTooltip, setPosicionTooltip] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const isHoveringRef = useRef(false);
  const isLoadingRef = useRef(false);
  const [svgContent, setSvgContent] = useState('');
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Mapeo de estados de Venezuela con sus códigos y nombres
  const estadosVenezuela = {
    'VEA': 'Distrito Capital',
    'VEB': 'Anzoátegui', 
    'VEC': 'Apure',
    'VED': 'Aragua',
    'VEE': 'Barinas',
    'VEF': 'Bolívar',
    'VEG': 'Carabobo',
    'VEH': 'Cojedes',
    'VEI': 'Falcón',
    'VEJ': 'Guárico',
    'VEK': 'Lara',
    'VEL': 'Mérida',
    'VEM': 'Miranda',
    'VEN': 'Monagas',
    'VEO': 'Nueva Esparta',
    'VEP': 'Portuguesa',
    'VER': 'Sucre',
    'VES': 'Táchira',
    'VET': 'Trujillo',
    'VEU': 'Yaracuy',
    'VEV': 'Zulia',
    'VEW': 'Dependencias Federales',
    'VEX': 'La Guaira',
    'VEY': 'Delta Amacuro',
    'VEZ': 'Amazonas'
  };

  useEffect(() => {
    cargarDatos();
  }, [filtros, forceRefresh]);

  // Función para unificar estados con y sin acento sumando sus valores
  const unificarEstados = (datosOriginales) => {
    const estadosUnificados = {};
    
    // Mapeo de estados sin acento a estados con acento (versión preferida)
    const mapeoAcentos = {
      'ANZOATEGUI': 'ANZOÁTEGUI',
      'FALCON': 'FALCÓN',
      'GUARICO': 'GUÁRICO', 
      'MERIDA': 'MÉRIDA',
      'TACHIRA': 'TÁCHIRA'
    };

    datosOriginales.forEach(item => {
      const estadoOriginal = item.ESTADO;
      const estadoPreferido = mapeoAcentos[estadoOriginal] || estadoOriginal;
      
      if (!estadosUnificados[estadoPreferido]) {
        estadosUnificados[estadoPreferido] = {
          ESTADO: estadoPreferido,
          ESTADO2: estadoPreferido,
          RATIO_ACT: 0,
          VENTAS_2024: 0,
          VENTAS_2025: 0,
          VARIACION: 0
        };
      }
      
      // Sumar los valores
      estadosUnificados[estadoPreferido].RATIO_ACT += parseFloat(item.RATIO_ACT || 0);
      estadosUnificados[estadoPreferido].VENTAS_2024 += parseFloat(item.VENTAS_2024 || 0);
      estadosUnificados[estadoPreferido].VENTAS_2025 += parseFloat(item.VENTAS_2025 || 0);
      estadosUnificados[estadoPreferido].VARIACION += parseFloat(item.VARIACION || 0);
    });

    return Object.values(estadosUnificados);
  };

  const cargarDatos = async () => {
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_ventas_mapa_venezuela_v3', {
        p_mes: filtros?.mes || 'All',
        p_aliado: filtros?.aliado || 'All',
        p_sucursal: filtros?.sucursal || 'All',
        p_marca: filtros?.marca || 'All',
        p_dep: filtros?.rubro || 'All',
        p_gpo: filtros?.portafolio_interno || 'All',
        p_cat: filtros?.consumo_masivo || 'All',
        p_ver: filtros?.version || 'All',
        p_presentacion: filtros?.presentacion || 'All',
        p_estado: filtros?.estado || 'All',
        p_tipo_cliente: filtros?.tipo_cliente || 'All'
      });

      if (error) {
        throw error;
      }

      // Unificar estados con y sin acento antes de setear los datos
      const datosUnificados = unificarEstados(data || []);
      setDatos(datosUnificados);
    } catch (err) {
      console.error('Error cargando datos del mapa:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Mapeo de códigos SVG a nombres de estados en los datos (usando versiones con acento)
  const codigoANombre = {
    'VEA': 'DISTRITO CAPITAL',
    'VEB': 'ANZOÁTEGUI', 
    'VEC': 'APURE',
    'VED': 'ARAGUA',
    'VEE': 'BARINAS',
    'VEF': 'BOLÍVAR',
    'VEG': 'CARABOBO',
    'VEH': 'COJEDES',
    'VEI': 'FALCÓN',
    'VEJ': 'GUÁRICO',
    'VEK': 'LARA',
    'VEL': 'MÉRIDA',
    'VEM': 'MIRANDA',
    'VEN': 'MONAGAS',
    'VEO': 'NUEVA ESPARTA',
    'VEP': 'PORTUGUESA',
    'VER': 'SUCRE',
    'VES': 'TÁCHIRA',
    'VET': 'TRUJILLO',
    'VEU': 'YARACUY',
    'VEV': 'ZULIA',
    'VEW': 'DEPENDENCIAS FEDERALES',
    'VEX': 'LA GUAIRA',
    'VEY': 'DELTA AMACURO',
    'VEZ': 'AMAZONAS'
  };

  const obtenerColorEstado = (codigoEstado) => {
    const nombreEstado = codigoANombre[codigoEstado];
    if (!nombreEstado) return '#e5e7eb';
    
    const dato = datos.find(d => 
      d.ESTADO === nombreEstado || 
      d.ESTADO === nombreEstado.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
    );
    
    if (!dato || !dato.RATIO_ACT) return '#e5e7eb'; // Gris claro por defecto
    
    const valor = parseFloat(dato.RATIO_ACT) * 100; // Convertir a porcentaje
    
    // Usar solo tonos verdes basados en el porcentaje
    if (valor >= 20) return '#0f5132'; // Verde muy oscuro
    if (valor >= 15) return '#198754'; // Verde oscuro
    if (valor >= 10) return '#20c997'; // Verde medio
    if (valor >= 5) return '#6f9c76';  // Verde claro
    if (valor > 0) return '#a3cfbb';   // Verde muy claro
    return '#e5e7eb'; // Gris para sin datos
  };

  const obtenerColorHover = (estado) => {
    const colorBase = obtenerColorEstado(estado);
    if (colorBase === '#e5e7eb') return '#d1d5db'; // Gris más oscuro
    
    // Hacer el color más oscuro para el hover
    const colors = {
      '#0f5132': '#0a3d26', // Verde muy oscuro más oscuro
      '#198754': '#146c43', // Verde oscuro más oscuro
      '#20c997': '#1ba97a', // Verde medio más oscuro
      '#6f9c76': '#5a8063', // Verde claro más oscuro
      '#a3cfbb': '#8bb5a0'  // Verde muy claro más oscuro
    };
    
    return colors[colorBase] || colorBase;
  };

  const obtenerPorcentaje = (codigoEstado) => {
    const nombreEstado = codigoANombre[codigoEstado];
    if (!nombreEstado) return '0.00%';
    
    const dato = datos.find(d => 
      d.ESTADO === nombreEstado || 
      d.ESTADO === nombreEstado.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
    );
    
    if (!dato || !dato.RATIO_ACT) return '0.00%';
    
    const valor = parseFloat(dato.RATIO_ACT) * 100;
    return `${valor.toFixed(2)}%`;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setLastPan({ x: 0, y: 0 });
  };

  // Funciones para manejar el pan (arrastre)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Solo botón izquierdo
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panX,
      y: e.clientY - panY
    });
    e.preventDefault();
  };

  const handlePanMove = (e) => {
    if (!isDragging) return;
    
    const newPanX = e.clientX - dragStart.x;
    const newPanY = e.clientY - dragStart.y;
    
    setPanX(newPanX);
    setPanY(newPanY);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setLastPan({ x: panX, y: panY });
    }
  };

  const handleMouseLeaveContainer = () => {
    if (isDragging) {
      setIsDragging(false);
      setLastPan({ x: panX, y: panY });
    }
  };

  // Manejar zoom con rueda del mouse
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
  };

  // Función para re-aplicar colores, estilos, labels y event listeners
  const reapplyColorsAndEvents = () => {
    if (!svgRef.current || datos.length === 0) return;
    
    const svgElement = svgRef.current;
    const statePaths = svgElement.querySelectorAll('[id^="VE"]');
    
    // Re-aplicar estilos y event listeners a cada path
    statePaths.forEach(path => {
      const stateId = path.getAttribute('id');
      if (!stateId || !estadosVenezuela[stateId]) return;
      
      // Remover event listeners existentes antes de agregar nuevos
      const newPath = path.cloneNode(true);
      path.parentNode.replaceChild(newPath, path);
      
      // Re-aplicar estilos al nuevo path
      newPath.style.cursor = 'pointer';
      newPath.style.transition = 'fill 0.2s ease';
      newPath.style.fill = obtenerColorEstado(stateId);
      newPath.style.stroke = '#ffffff';
      newPath.style.strokeWidth = '0.5';
      
      // Re-aplicar event listeners
      const handleMouseEnterPath = (e) => {
        const nombreEstado = codigoANombre[stateId];
        const dato = datos.find(d => 
          d.ESTADO === nombreEstado || 
          d.ESTADO === nombreEstado?.replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        );
        
        newPath.style.fill = obtenerColorHover(stateId);
        isHoveringRef.current = true;
        
        if (dato && tooltipRef.current) {
          // Actualizar tooltip directamente sin setState
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = (e.clientX + 10) + 'px';
          tooltipRef.current.style.top = (e.clientY - 10) + 'px';
          tooltipRef.current.style.transform = 'translate(0, -100%)';
          
          // Actualizar contenido del tooltip
          const estadoData = {
            estado: stateId,
            nombre: estadosVenezuela[stateId] || stateId,
            valor: dato?.RATIO_ACT || 0,
            porcentaje: obtenerPorcentaje(stateId),
            dato: dato
          };
          
          updateTooltipContent(estadoData);
        }
      };

      const handleClickPath = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nombreEstado = codigoANombre[stateId];
        console.log('Click en estado:', stateId, 'Nombre:', nombreEstado);
        if (nombreEstado && onFiltroInternoChange) {         
          // Aplicar filtro por estado específico
          onFiltroInternoChange('estado', nombreEstado);
          console.log('Filtro aplicado:', nombreEstado);
        }
      };
      
      const handleMouseLeavePath = () => {
        newPath.style.fill = obtenerColorEstado(stateId);
        isHoveringRef.current = false;
        
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      };
      
      const handleMouseMovePath = (e) => {
        if (isHoveringRef.current && tooltipRef.current) {
          tooltipRef.current.style.left = (e.clientX + 10) + 'px';
          tooltipRef.current.style.top = (e.clientY - 10) + 'px';
        }
      };
      
      newPath.addEventListener('mouseenter', handleMouseEnterPath);
      newPath.addEventListener('mouseleave', handleMouseLeavePath);
      newPath.addEventListener('mousemove', handleMouseMovePath);
      newPath.addEventListener('click', handleClickPath);
      
      // Prevenir que los eventos de drag interfieran con el click
      newPath.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
    });
    
    // Re-generar labels
    const svgContainer = svgElement.querySelector('svg');
    if (svgContainer) {
      // Limpiar labels existentes
      let textGroup = svgContainer.querySelector('#state-labels');
      if (textGroup) {
        textGroup.remove();
      }
      
      // Crear nuevo grupo para textos
      textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      textGroup.setAttribute('id', 'state-labels');
      svgContainer.appendChild(textGroup);
      
      // Agregar texto para cada estado
      Object.keys(estadosVenezuela).forEach(stateId => {
        const coords = coordenadasEstados[stateId];
        if (!coords) return;

        const nombreEstado = estadosVenezuela[stateId];
        const porcentaje = obtenerPorcentaje(stateId);

        // Crear un solo fondo unificado para ambos textos
        const rectUnificado = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const nombreTexto = nombreEstado.split(' ')[0].toUpperCase();
        
        // Calcular el ancho máximo entre nombre y porcentaje
        const nombreWidth = nombreTexto.length * 4.5;
        const porcentajeWidth = porcentaje.length * 4;
        const maxWidth = Math.max(nombreWidth, porcentajeWidth) + 15; // Agregar padding
        
        rectUnificado.setAttribute('x', coords.x - maxWidth / 2);
        rectUnificado.setAttribute('y', coords.y - 11);
        rectUnificado.setAttribute('width', maxWidth);
        rectUnificado.setAttribute('height', '20');
        rectUnificado.setAttribute('fill', 'rgba(255, 255, 255, 0.4)');
        rectUnificado.setAttribute('rx', '5');

        // Crear texto para el nombre del estado
        const textNombre = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textNombre.setAttribute('x', coords.x);
        textNombre.setAttribute('y', coords.y - 3);
        textNombre.setAttribute('text-anchor', 'middle');
        textNombre.setAttribute('font-family', 'Arial, sans-serif');
        textNombre.setAttribute('font-size', '8');
        textNombre.setAttribute('font-weight', 'bold');
        textNombre.setAttribute('fill', '#000000');
        textNombre.setAttribute('stroke', 'none');
        textNombre.setAttribute('stroke-width', '0');
        textNombre.textContent = nombreTexto;

        // Crear texto para el porcentaje
        const textPorcentaje = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textPorcentaje.setAttribute('x', coords.x);
        textPorcentaje.setAttribute('y', coords.y + 7);
        textPorcentaje.setAttribute('text-anchor', 'middle');
        textPorcentaje.setAttribute('font-family', 'Arial, sans-serif');
        textPorcentaje.setAttribute('font-size', '8');
        textPorcentaje.setAttribute('font-weight', 'bold');
        textPorcentaje.setAttribute('fill', '#000000');
        textPorcentaje.setAttribute('stroke', 'none');
        textPorcentaje.setAttribute('stroke-width', '0');
        textPorcentaje.textContent = porcentaje;

        // Agregar elementos en orden: fondo primero, textos después
        textGroup.appendChild(rectUnificado);
        textGroup.appendChild(textNombre);
        textGroup.appendChild(textPorcentaje);
      });
    }
  };

  // Función para actualizar contenido del tooltip sin re-render
  const updateTooltipContent = (estadoData) => {
    if (!tooltipRef.current) return;
    
    tooltipRef.current.innerHTML = `
      <div class="font-semibold text-base mb-2">${estadoData.nombre}</div>
      ${estadoData.dato ? `
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-300">% de Ventas:</span>
            <span class="font-medium text-green-400">${estadoData.porcentaje}</span>
          </div>
          ${estadoData.dato.VENTAS_2024 ? `
            <div class="flex justify-between">
              <span class="text-gray-300">Ventas 2024:</span>
              <span class="font-medium text-green-400">
                ${parseFloat(estadoData.dato.VENTAS_2024).toLocaleString('es-ES')}
              </span>
            </div>
          ` : ''}
          ${estadoData.dato.VENTAS_2025 ? `
            <div class="flex justify-between">
              <span class="text-gray-300">Ventas 2025:</span>
              <span class="font-medium text-red-400">
                ${parseFloat(estadoData.dato.VENTAS_2025).toLocaleString('es-ES')}
              </span>
            </div>
          ` : ''}
          ${estadoData.dato.VARIACION ? `
            <div class="flex justify-between">
              <span class="text-gray-300">Variación:</span>
              <span class="font-medium ${parseFloat(estadoData.dato.VARIACION) >= 0 ? 'text-green-400' : 'text-red-400'}">
                ${parseFloat(estadoData.dato.VARIACION) >= 0 ? '+' : ''}${parseFloat(estadoData.dato.VARIACION).toLocaleString('es-ES', { 
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1 
                })}%
              </span>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="text-sm text-gray-400">Sin datos disponibles</div>
      `}
      <div class="text-xs text-gray-400 mt-2 italic">Haz clic para filtrar por este estado</div>
    `;
  };

  // Función legacy para compatibilidad
  const reapplyColors = () => {
    reapplyColorsAndEvents();
  };

  // Cargar el SVG del mapa de Venezuela
  useEffect(() => {
    // Cargar el contenido del SVG
    const loadSvg = async () => {
      try {
        const response = await fetch(veSvgUrl);
        if (!response.ok) {
          throw new Error('No se pudo cargar el SVG');
        }
        const content = await response.text();
        setSvgContent(content);
      } catch (error) {
        console.error('Error cargando SVG:', error);
        // Usar un SVG simplificado como fallback
        setSvgContent(`
          <svg viewBox="0 0 1000 877" xmlns="http://www.w3.org/2000/svg">
            <g id="features">
              <rect x="400" y="150" width="100" height="50" id="VEA" />
              <rect x="600" y="250" width="120" height="80" id="VEB" />
              <rect x="300" y="350" width="100" height="70" id="VEC" />
              <rect x="380" y="160" width="90" height="60" id="VED" />
              <rect x="200" y="280" width="100" height="80" id="VEE" />
              <rect x="650" y="400" width="150" height="120" id="VEF" />
              <rect x="350" y="150" width="80" height="50" id="VEG" />
              <rect x="320" y="200" width="80" height="60" id="VEH" />
              <rect x="220" y="100" width="100" height="70" id="VEI" />
              <rect x="450" y="250" width="100" height="80" id="VEJ" />
              <rect x="220" y="170" width="90" height="70" id="VEK" />
              <rect x="120" y="260" width="80" height="80" id="VEL" />
              <rect x="440" y="160" width="80" height="50" id="VEM" />
              <rect x="670" y="200" width="100" height="70" id="VEN" />
              <rect x="620" y="100" width="80" height="60" id="VEO" />
              <rect x="260" y="220" width="90" height="70" id="VEP" />
              <rect x="670" y="130" width="80" height="70" id="VER" />
              <rect x="80" y="310" width="80" height="70" id="VES" />
              <rect x="180" y="210" width="80" height="70" id="VET" />
              <rect x="300" y="150" width="70" height="60" id="VEU" />
              <rect x="50" y="190" width="100" height="80" id="VEV" />
              <rect x="520" y="100" width="90" height="70" id="VEW" />
              <rect x="410" y="140" width="60" height="40" id="VEX" />
              <rect x="780" y="230" width="100" height="80" id="VEY" />
              <rect x="480" y="600" width="120" height="100" id="VEZ" />
            </g>
          </svg>
        `);
      }
    };
    
    loadSvg();
  }, []);

  // Coordenadas aproximadas para el centro de cada estado
  const coordenadasEstados = {
    'VEA': { x: 470, y: 177 }, // Distrito Capital
    'VEB': { x: 657, y: 297 }, // Anzoátegui
    'VEC': { x: 353, y: 410 }, // Apure
    'VED': { x: 446, y: 198 }, // Aragua
    'VEE': { x: 253, y: 323 }, // Barinas
    'VEF': { x: 718, y: 473 }, // Bolívar
    'VEG': { x: 398, y: 193 }, // Carabobo
    'VEH': { x: 380, y: 243 }, // Cojedes
    'VEI': { x: 285, y: 136 }, // Falcón
    'VEJ': { x: 525, y: 303 }, // Guárico
    'VEK': { x: 285, y: 197 }, // Lara
    'VEL': { x: 185, y: 308 }, // Mérida
    'VEM': { x: 511, y: 190 }, // Miranda
    'VEN': { x: 736, y: 248 }, // Monagas
    'VEO': { x: 676, y: 140 }, // Nueva Esparta
    'VEP': { x: 320, y: 270 }, // Portuguesa
    'VER': { x: 729, y: 179 }, // Sucre
    'VES': { x: 135, y: 356 }, // Táchira
    'VET': { x: 225, y: 250 }, // Trujillo
    'VEU': { x: 335, y: 175 }, // Yaracuy
    'VEV': { x: 125, y: 235 }, // Zulia
    'VEW': { x: 575, y: 135 }, // Dependencias Federales
    'VEX': { x: 450, y: 165 }, // La Guaira
    'VEY': { x: 830, y: 270 }, // Delta Amacuro
    'VEZ': { x: 550, y: 650 }  // Amazonas
  };

  // Cargar SVG al montar el componente
  useEffect(() => {
    const cargarSVG = async () => {
      try {
        const response = await fetch(veSvgUrl);
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error('Error al cargar SVG:', error);
      }
    };
    
    cargarSVG();
  }, []);

  // Cargar datos cuando cambien los filtros o se fuerce el refresh
  useEffect(() => {
    cargarDatos();
  }, [filtros, forceRefresh]);

  // Re-aplicar colores y eventos cuando cambien los datos o el SVG
  useEffect(() => {
    if (svgContent && datos.length > 0) {
      // Delay más largo para asegurar que el DOM esté completamente renderizado
      const timer = setTimeout(() => {
        reapplyColorsAndEvents();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [datos, svgContent]);

  // Re-aplicar colores cuando cambie el zoom o pan
  useEffect(() => {
    if (datos.length > 0 && svgRef.current) {
      // Aplicar colores inmediatamente para evitar parpadeo
      reapplyColors();
      
      // También aplicar después de un delay corto por si acaso
      setTimeout(() => {
        reapplyColors();
        
        // También aplicar después de un delay corto por si acaso
        setTimeout(() => {
          reapplyColors();
        }, 50);
      }, 100);
    }
  }, [zoom, panX, panY]);

  // Event listeners globales para el arrastre
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        handlePanMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, panX, panY, dragStart]);

  const handleMouseEnter = (estado, event) => {
    const dato = datos.find(d => d.ESTADO === estado);
    setEstadoSeleccionado({
      estado,
      nombre: estadosVenezuela[estado] || estado,
      valor: dato?.RATIO_ACT || 0,
      dato: dato
    });
    setPosicionTooltip({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    setPosicionTooltip({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setEstadoSeleccionado(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 relative">        
        {/* Skeleton del mapa */}
        <div className="relative">
          <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="w-64 h-48 bg-gray-200 rounded-lg mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 relative">
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Error: {error}
          </p>
        </div>
        <div className="text-center py-8">
          <button 
            onClick={cargarDatos}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Preparar datos para exportar
  const prepareExportData = () => {
    return datos.map(item => ({
      'Estado': estadosVenezuela[item.ESTADO] || item.ESTADO,
      'Código': item.ESTADO,
      'Ratio Activación (%)': item.RATIO_ACT ? `${item.RATIO_ACT.toFixed(2)}%` : '0.00%',
      'Total Aliados': item.TOTAL_ALIADOS || 0,
      'Aliados Activos': item.ALIADOS_ACTIVOS || 0
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton onRefresh={cargarDatos} />
        <ExcelExportButton
          data={prepareExportData()}
          filename="mapa_activacion_estados"
          title="Reporte de Activación por Estados"
          sheetName="Activación Estados"
          columns={[
            { header: 'Estado', key: 'Estado', width: 20 },
            { header: 'Código', key: 'Código', width: 10 },
            { header: 'Ratio Activación (%)', key: 'Ratio Activación (%)', width: 18 },
            { header: 'Total Aliados', key: 'Total Aliados', width: 15 },
            { header: 'Aliados Activos', key: 'Aliados Activos', width: 15 }
          ]}
        />
      </div>
      
      <div className="relative">
        {/* Mapa SVG interactivo */}
        <div 
          ref={containerRef}
          className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handlePanMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeaveContainer}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="w-full h-64 sm:h-80 lg:h-96 flex items-center justify-center">
            {svgContent ? (
              <div
                ref={svgRef}
                className="w-full h-full"
                style={{ 
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  userSelect: 'none'
                }}
                dangerouslySetInnerHTML={{
                  __html: svgContent.replace(
                    /<svg[^>]*>/,
                    '<svg baseProfile="tiny" fill="#e5e7eb" height="877" stroke="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0" version="1.2" viewBox="0 0 1000 877" width="1000" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">'
                  )
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-500">Cargando mapa...</div>
              </div>
            )}
          </div>
        </div>

        {/* Controles de zoom flotantes */}
        <div className="absolute top-40 left-2 sm:left-4 flex flex-col space-y-1 sm:space-y-2 z-10">
          <button
            onClick={handleZoomIn}
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md transition-colors"
            title="Acercar (o usa la rueda del mouse)"
          >
            <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md transition-colors"
            title="Alejar (o usa la rueda del mouse)"
          >
            <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
          </button>
          <button
            onClick={resetZoom}
            className="p-1.5 sm:p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md transition-colors"
            title="Restablecer zoom y posición"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700" />
          </button>
        </div>


        {/* Leyenda */}
        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-3 lg:gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: '#a3cfbb' }}></div>
              <span className="whitespace-nowrap">5-10%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: '#20c997' }}></div>
              <span className="whitespace-nowrap">10-15%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: '#198754' }}></div>
              <span className="whitespace-nowrap">15-20%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: '#0f5132' }}></div>
              <span className="whitespace-nowrap">20%+</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded flex-shrink-0"></div>
              <span className="whitespace-nowrap">Sin datos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip directo sin React state */}
      <div 
        ref={tooltipRef}
        className="fixed z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg pointer-events-none min-w-48"
        style={{ display: 'none' }}
      >
        {/* Contenido será actualizado dinámicamente por updateTooltipContent */}
      </div>
    </div>
  );
};

export default MapaVenezuelaWidget;
