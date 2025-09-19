QUERYS PANEL VENTAS - VENTAS
----------------------------

FILTROS

RUBRO: dep
```sql
SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" WHERE dep IS NOT NULL ORDER BY dep;
```

PORTAFOLIO INTERNO: gpo
```sql
SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" WHERE gpo IS NOT NULL ORDER BY gpo;
```

CONSUMO MASIVO: cat
```sql
SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" WHERE cat IS NOT NULL ORDER BY cat;
```

MARCA: marca
```sql
SELECT DISTINCT marca FROM "HOMOLOGACIONVTA" WHERE marca IS NOT NULL ORDER BY marca;
```

VERSION: ver
```sql
SELECT DISTINCT ver FROM "HOMOLOGACIONVTA" WHERE ver IS NOT NULL ORDER BY ver;
```

PRESENTACION: presentacion
```sql
SELECT DISTINCT presentacion FROM "HOMOLOGACIONVTA" WHERE presentacion IS NOT NULL ORDER BY presentacion;
```

MES: mes
```sql
SELECT DISTINCT mes FROM "HOMOLOGACIONVTA" WHERE mes IS NOT NULL ORDER BY mes;
```

ALIADO: aliado
```sql
SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" WHERE aliado IS NOT NULL ORDER BY aliado;
```

SUCURSAL: sucursal
```sql
SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" WHERE sucursal IS NOT NULL ORDER BY sucursal;
```


QUERY TABLA GRUPO - MES
```sql
SELECT 
    mes,
    gpo,
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025"
FROM "HOMOLOGACIONVTA" 
WHERE mes IS NOT NULL AND gpo IS NOT NULL
GROUP BY mes, gpo
ORDER BY mes, gpo;
```

QUERY MAPA DE VENEZUELA
```sql
SELECT 
    estado as "ESTADO",
    estado as "ESTADO2",
    SUM(ratio_act::numeric) as "RATIO_ACT"
FROM "HOMOLOGACIONVTA" 
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY estado;
```

QUERY GRAFICO BARRAS 1 (Por GPO - Grupos de Productos)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    gpo as "GPO"
FROM "HOMOLOGACIONVTA" 
WHERE gpo IS NOT NULL
GROUP BY gpo
ORDER BY gpo;
```

QUERY GRAFICO BARRAS 2 (Por MES)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    mes as "MES"
FROM "HOMOLOGACIONVTA" 
WHERE mes IS NOT NULL
GROUP BY mes
ORDER BY 
    CASE mes
        WHEN 'Enero' THEN 1
        WHEN 'Febrero' THEN 2
        WHEN 'Marzo' THEN 3
        WHEN 'Abril' THEN 4
        WHEN 'Mayo' THEN 5
        WHEN 'Junio' THEN 6
        WHEN 'Julio' THEN 7
        WHEN 'Agosto' THEN 8
        WHEN 'Septiembre' THEN 9
        WHEN 'Octubre' THEN 10
        WHEN 'Noviembre' THEN 11
        WHEN 'Diciembre' THEN 12
    END;
```




-----------------------------------------------
PANEL VENTAS > REGION - GRUPO - TIPO DE NEGOCIO
-----------------------------------------------

FILTROS
-- REGION: region
```sql
SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE region IS NOT NULL ORDER BY region;
```

-- GRUPO: gpo
```sql
SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" WHERE gpo IS NOT NULL ORDER BY gpo;
```

-- TIPO DE NEGOCIO: tipocliente
```sql
SELECT DISTINCT tipocliente FROM "HOMOLOGACIONVTA" WHERE tipocliente IS NOT NULL ORDER BY tipocliente;
```

QUERY TABLA TIPO CLIENTE (Imagen 1 y 2)
```sql
SELECT 
    tipocliente as "TIPO CLIENTE",
    SUM(pesoanterior::numeric) / NULLIF((SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL), 0) as "2024 (%)",
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) / NULLIF((SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL), 0) as "2025 (%)",
    SUM(pesoactual::numeric) as "2025",
    CASE 
        WHEN SUM(pesoanterior::numeric) > 0 THEN 
            (SUM(pesoactual::numeric) - SUM(pesoanterior::numeric)) / SUM(pesoanterior::numeric)
        ELSE NULL 
    END as "DIFERENCIA"
FROM "HOMOLOGACIONVTA" 
WHERE tipocliente IS NOT NULL
GROUP BY tipocliente
ORDER BY tipocliente;
```

QUERY GRAFICO BARRAS 1 (Por GPO - Imagen 3)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    gpo as "GPO"
FROM "HOMOLOGACIONVTA" 
WHERE gpo IS NOT NULL
GROUP BY gpo
ORDER BY gpo;
```

QUERY GRAFICO BARRAS 2 (Por TIPO CLIENTE - Imagen 4)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    tipocliente as "TIPOCLIENTE"
FROM "HOMOLOGACIONVTA" 
WHERE tipocliente IS NOT NULL
GROUP BY tipocliente
ORDER BY tipocliente;
```




-----------------------------------------------
PANEL VENTAS > REGION - ALIADOS - SKU
-----------------------------------------------

FILTROS

-- SKU: sku
```sql
SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" WHERE sku IS NOT NULL ORDER BY sku;
```

QUERY TABLA SKU (Imagen 1 y 2)
```sql
SELECT 
    sku as "SKU",
    SUM(pesoanterior::numeric) / NULLIF((SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL), 0) as "2024 (%)",
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) / NULLIF((SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL), 0) as "2025 (%)",
    SUM(pesoactual::numeric) as "2025",
    CASE 
        WHEN SUM(pesoanterior::numeric) > 0 THEN 
            (SUM(pesoactual::numeric) - SUM(pesoanterior::numeric)) / SUM(pesoanterior::numeric) * 100
        ELSE NULL 
    END as "PORCENTAJE"
FROM "HOMOLOGACIONVTA" 
WHERE sku IS NOT NULL
GROUP BY sku
ORDER BY sku;
```

QUERY GRAFICO BARRAS 1 (Por MES - Imagen 3)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    mes as "MES"
FROM "HOMOLOGACIONVTA" 
WHERE mes IS NOT NULL
GROUP BY mes
ORDER BY 
    CASE mes
        WHEN 'Enero' THEN 1
        WHEN 'Febrero' THEN 2
        WHEN 'Marzo' THEN 3
        WHEN 'Abril' THEN 4
        WHEN 'Mayo' THEN 5
        WHEN 'Junio' THEN 6
        WHEN 'Julio' THEN 7
        WHEN 'Agosto' THEN 8
        WHEN 'Septiembre' THEN 9
        WHEN 'Octubre' THEN 10
        WHEN 'Noviembre' THEN 11
        WHEN 'Diciembre' THEN 12
    END;
```

QUERY GRAFICO BARRAS 2 (Por TIPO CLIENTE - Imagen 4)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    tipocliente as "TIPOCLIENTE"
FROM "HOMOLOGACIONVTA" 
WHERE tipocliente IS NOT NULL
GROUP BY tipocliente
ORDER BY tipocliente;
```

QUERY TOTAL 2024 (Imagen 5)
```sql
SELECT 
    SUM(pesoanterior::numeric) as "PESOANTERIOR"
FROM "HOMOLOGACIONVTA" 
WHERE pesoanterior IS NOT NULL;
```

QUERY TOTAL 2025 (Imagen 6)
```sql
SELECT 
    SUM(pesoactual::numeric) as "PESOACTUAL"
FROM "HOMOLOGACIONVTA" 
WHERE pesoactual IS NOT NULL;
```

