import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import io
import base64
from django.shortcuts import render
from sklearn.metrics import roc_curve, auc

# Simulación de datos de predicción
np.random.seed(42)
scores = np.random.rand(100)  # Scores de predicción
labels = np.random.choice([0, 1], size=100)  # Etiquetas 0 o 1
fpr, tpr, _ = roc_curve(labels, scores)
roc_auc = auc(fpr, tpr)

# Función para generar gráficos y devolver imágenes en base64
def plot_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    image_base64 = base64.b64encode(buf.getvalue()).decode()
    buf.close()
    return image_base64

def dashboard_view(request):
    # Histograma de scores
    fig1, ax1 = plt.subplots()
    sns.histplot(scores, bins=10, kde=True, ax=ax1)
    ax1.set_title("Histograma de Scores")
    hist_scores = plot_to_base64(fig1)

    # Histograma de etiquetas
    fig2, ax2 = plt.subplots()
    sns.histplot(labels, bins=2, discrete=True, ax=ax2)
    ax2.set_title("Distribución de Etiquetas")
    hist_labels = plot_to_base64(fig2)

    # Curva ROC
    fig3, ax3 = plt.subplots()
    ax3.plot(fpr, tpr, color='blue', label=f'ROC curve (area = {roc_auc:.2f})')
    ax3.plot([0, 1], [0, 1], color='gray', linestyle='--')
    ax3.set_xlabel("False Positive Rate")
    ax3.set_ylabel("True Positive Rate")
    ax3.legend(loc="lower right")
    ax3.set_title("Curva ROC")
    roc_curve_plot = plot_to_base64(fig3)

    context = {
        'hist_scores': hist_scores,
        'hist_labels': hist_labels,
        'roc_curve': roc_curve_plot
    }
    return render(request, 'index.html')
