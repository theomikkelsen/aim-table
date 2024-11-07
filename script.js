document.addEventListener("DOMContentLoaded", () => {
  const tableContainer = document.querySelector(".table-container");
  const headerRow = tableContainer.querySelector(".header-row");
  let headers = Array.from(
    headerRow.querySelectorAll(".cell:not(.fixed-column)")
  );
  let startX, startWidths, colIndex;
  const minWidth = 50;

  // Initialize column widths equally
  headers.forEach((header) => {
    header.style.flex = "1";
  });

  // Initialize cells in each row
  const rows = tableContainer.querySelectorAll(".table-row:not(.header-row)");
  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll(".cell")).filter(
      (cell) => !cell.classList.contains("fixed-column")
    );
    cells.forEach((cell) => {
      cell.style.flex = "1";
    });
  });

  // Resizing functionality (same as before)
  headers.forEach((header, index) => {
    const resizer = header.querySelector(".resizer");
    if (!resizer) return; // No resizer on the last column

    resizer.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      colIndex = index;

      // Store the initial widths of all resizable columns
      startWidths = headers.map((header) => header.offsetWidth);

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });

  function onMouseMove(e) {
    const dx = e.clientX - startX;

    // Calculate new widths for the current and next columns
    const currentHeader = headers[colIndex];
    const nextHeader = headers[colIndex + 1];

    let newCurrentWidth = startWidths[colIndex] + dx;
    let newNextWidth = startWidths[colIndex + 1] - dx;

    // Enforce minimum widths
    if (newCurrentWidth < minWidth) {
      newCurrentWidth = minWidth;
      newNextWidth =
        startWidths[colIndex] + startWidths[colIndex + 1] - minWidth;
    } else if (newNextWidth < minWidth) {
      newNextWidth = minWidth;
      newCurrentWidth =
        startWidths[colIndex] + startWidths[colIndex + 1] - minWidth;
    }

    // Set the flex-basis of the headers
    currentHeader.style.flex = `0 0 ${newCurrentWidth}px`;
    nextHeader.style.flex = `0 0 ${newNextWidth}px`;

    // Update the flex-basis of the cells in each row
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll(".cell")).filter(
        (cell) =>
          !cell.classList.contains("fixed-column") &&
          !cell.classList.contains("hidden")
      );
      const currentCell = cells[colIndex];
      const nextCell = cells[colIndex + 1];
      currentCell.style.flex = `0 0 ${newCurrentWidth}px`;
      nextCell.style.flex = `0 0 ${newNextWidth}px`;
    });

    // Update column widths display
    displayColumnWidths();
  }

  function onMouseUp() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }

  // Drag-and-drop functionality
  headers.forEach((header) => {
    header.setAttribute("draggable", true);

    header.addEventListener("dragstart", (e) => {
      header.classList.add("dragging");
      e.dataTransfer.setData("text/plain", header.getAttribute("data-col"));
    });

    header.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingHeader = document.querySelector(".cell.dragging");
      if (draggingHeader === header) return;

      header.classList.add("placeholder");
    });

    header.addEventListener("dragleave", (e) => {
      header.classList.remove("placeholder");
    });

    header.addEventListener("drop", (e) => {
      e.preventDefault();
      header.classList.remove("placeholder");
      const draggedColId = e.dataTransfer.getData("text/plain");
      const targetColId = header.getAttribute("data-col");

      if (draggedColId === targetColId) return;

      // Swap columns
      swapColumns(draggedColId, targetColId);
    });

    header.addEventListener("dragend", () => {
      header.classList.remove("dragging");
      headers.forEach((h) => h.classList.remove("placeholder"));
    });
  });

  function swapColumns(draggedColId, targetColId) {
    // Swap headers
    const draggedHeader = headerRow.querySelector(
      `.cell[data-col="${draggedColId}"]`
    );
    const targetHeader = headerRow.querySelector(
      `.cell[data-col="${targetColId}"]`
    );

    if (draggedHeader && targetHeader) {
      if (draggedHeader.nextSibling === targetHeader) {
        headerRow.insertBefore(targetHeader, draggedHeader);
      } else {
        headerRow.insertBefore(draggedHeader, targetHeader);
      }
    }

    // Swap cells in each row
    rows.forEach((row) => {
      const draggedCell = row.querySelector(
        `.cell[data-col="${draggedColId}"]`
      );
      const targetCell = row.querySelector(`.cell[data-col="${targetColId}"]`);
      if (draggedCell && targetCell) {
        if (draggedCell.nextSibling === targetCell) {
          row.insertBefore(targetCell, draggedCell);
        } else {
          row.insertBefore(draggedCell, targetCell);
        }
      }
    });

    // Update headers array
    headers = Array.from(
      headerRow.querySelectorAll(".cell:not(.fixed-column)")
    );

    // Update resizers
    updateResizers();

    // Update column widths display
    displayColumnWidths();
  }

  function updateResizers() {
    // Remove existing resizers
    headerRow
      .querySelectorAll(".resizer")
      .forEach((resizer) => resizer.remove());

    // Add resizers to visible headers except the last one
    headers.forEach((header, index) => {
      if (index === headers.length - 1) return; // Skip last header

      const resizer = document.createElement("div");
      resizer.classList.add("resizer");
      header.appendChild(resizer);

      resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        colIndex = index;

        // Store the initial widths of all resizable columns
        startWidths = headers.map((header) => header.offsetWidth);

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
    });
  }

  // Column Visibility Toggle
  const checkboxes = document.querySelectorAll(
    '.controls input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const colId = e.target.getAttribute("data-col");
      const isVisible = e.target.checked;
      toggleColumnVisibility(colId, isVisible);
    });
  });

  function toggleColumnVisibility(colId, isVisible) {
    const header = headerRow.querySelector(`.cell[data-col="${colId}"]`);
    const cells = tableContainer.querySelectorAll(`.cell[data-col="${colId}"]`);

    if (isVisible) {
      header.classList.remove("hidden");
      cells.forEach((cell) => cell.classList.remove("hidden"));
    } else {
      header.classList.add("hidden");
      cells.forEach((cell) => cell.classList.add("hidden"));
    }

    // Update headers and resizers
    headers = Array.from(
      headerRow.querySelectorAll(".cell:not(.fixed-column):not(.hidden)")
    );
    updateResizers();

    // Adjust widths of remaining columns
    redistributeColumnWidths();

    // Update column widths display
    displayColumnWidths();
  }

  function redistributeColumnWidths() {
    const visibleHeaders = headers;
    const totalContainerWidth = tableContainer.offsetWidth - 200; // Subtract fixed columns width
    const equalWidth = totalContainerWidth / visibleHeaders.length;

    visibleHeaders.forEach((header) => {
      header.style.flex = `0 0 ${equalWidth}px`;
    });

    // Update cells in each row
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll(".cell")).filter(
        (cell) =>
          !cell.classList.contains("fixed-column") &&
          !cell.classList.contains("hidden")
      );
      cells.forEach((cell) => {
        cell.style.flex = `0 0 ${equalWidth}px`;
      });
    });
  }

  // Reset Button Functionality
  const resetButton = document.getElementById("resetButton");
  resetButton.addEventListener("click", () => {
    // Reset column widths
    headers.forEach((header) => {
      header.style.flex = "1";
    });

    // Reset cells in each row
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll(".cell")).filter(
        (cell) => !cell.classList.contains("fixed-column")
      );
      cells.forEach((cell) => {
        cell.style.flex = "1";
      });
    });

    // Reset checkboxes
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      const colId = checkbox.getAttribute("data-col");
      const header = headerRow.querySelector(`.cell[data-col="${colId}"]`);
      const cells = tableContainer.querySelectorAll(
        `.cell[data-col="${colId}"]`
      );
      header.classList.remove("hidden");
      cells.forEach((cell) => cell.classList.remove("hidden"));
    });

    // Update headers and resizers
    headers = Array.from(
      headerRow.querySelectorAll(".cell:not(.fixed-column):not(.hidden)")
    );
    updateResizers();

    // Update column widths display
    displayColumnWidths();
  });

  // Display Column Widths
  function displayColumnWidths() {
    const widthDisplayArea = document.getElementById("columnWidthsDisplay");
    const totalResizableWidth = headers.reduce(
      (sum, header) => sum + header.offsetWidth,
      0
    );
    const widths = headers.map((header) => {
      const colId = header.getAttribute("data-col");
      const percentage = (
        (header.offsetWidth / totalResizableWidth) *
        100
      ).toFixed(2);
      return `Column ${colId}: ${percentage}%`;
    });
    widthDisplayArea.textContent = widths.join(" | ");
  }

  // Initial setup
  updateResizers();
  displayColumnWidths();

  // Handle window resize
  window.addEventListener("resize", () => {
    redistributeColumnWidths();
    displayColumnWidths();
  });
});
