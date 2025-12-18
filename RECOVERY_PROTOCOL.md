# Protocolo de Recuperación ante Desastres (DRP)

Este documento describe los pasos a seguir para recuperar la operatividad del sistema de "Entrega de Juguetes" en caso de fallos críticos, pérdida de datos o errores en el código.

## 1. Recuperación de Datos (Base de Datos)

Si la base de datos se corrompe, se borra accidentalmente o contiene datos erróneos masivos, utilice este procedimiento.

### Requisitos
- Archivo de respaldo reciente (formato `.json`), generado desde el Panel Administrativo (Pestaña "Sistemas").
- Acceso de Administrador al sistema.

### Procedimiento
1.  **Acceda al Panel Administrativo**: Inicie sesión con credenciales de admin.
2.  **Navegue a "Sistemas / Respaldos"**: Seleccione la última pestaña del menú.
3.  **Localice la sección "Zona de Peligro - Restauración"**.
4.  **Cargar Archivo**: Seleccione su archivo `.json` de respaldo más reciente.
5.  **Confirmar Restauración**:
    -   El sistema le pedirá una confirmación explícita.
    -   Escriba la palabra clave solicitada (ej. `RESTAURAR`).
6.  **Esperar**: No cierre la ventana hasta que el sistema confirme "Restauración Completada".
7.  **Verificar**: Vaya a la pestañas de Estadísticas y verifique que los números coincidan con lo esperado.

> **ADVERTENCIA**: Este proceso **BORRA** todos los datos actuales y los reemplaza con los del respaldo. Cualquier dato ingresado después de la fecha del respaldo se perderá.

---

## 2. Recuperación del Código (Aplicación)

Si una actualización del código (despliegue) rompe la aplicación (pantalla blanca, errores de carga, bucles), debe volver a una versión estable anterior.

### Requisitos
- Acceso a la terminal/consola donde corre el servidor.
- Git instalado y configurado.

### Procedimiento (Git)

1.  **Detener el servidor actual** (si está corriendo):
    `Ctrl + C`

2.  **Verificar el historial de cambios**:
    ```bash
    git log --oneline
    ```
    Verá una lista como:
    ```
    a1b2c3d (HEAD) Fix bug in scanner <-- Versión actual (rota)
    x9y8z7w Update dependencies
    d4e5f6g Stable release v1.0 <-- Versión estable conocida
    ```

3.  **Volver a la versión estable**:
    Copie el ID de la versión estable (ej. `d4e5f6g`) y ejecute:
    ```bash
    git checkout d4e5f6g
    ```

4.  **Reinstalar dependencias (Opcional pero recomendado)**:
    Si la versión rota cambió librerías, es bueno limpiar:
    ```bash
    rm -rf node_modules
    npm install
    ```

5.  **Reiniciar el servidor**:
    ```bash
    npm run dev
    # o para producción
    npm run build
    npm run preview
    ```

### Cómo volver al presente (Deshacer el rollback)
Una vez solucionado el problema o para intentar arreglar el código roto:
```bash
git checkout main
```
(O la rama en la que estaba trabajando).
