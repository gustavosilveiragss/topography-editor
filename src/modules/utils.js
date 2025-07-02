class Utils {
    showStatus(message, type) {
        const statusDiv = document.getElementById('file-status');
        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;
        statusDiv.style.display = 'block';
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }
}

export const utils = new Utils();
