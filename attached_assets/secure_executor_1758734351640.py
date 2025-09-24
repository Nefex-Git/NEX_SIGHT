# backend/secure_executor.py
import io
import contextlib
import matplotlib.pyplot as plt

def run_generated_code(code: str, local_vars: dict):


    output_buffer = io.StringIO()

    if 'df' not in local_vars:
        return "No DataFrame provided", "Missing df"

    print("[🔍] Columns in df before exec:", local_vars['df'].columns.tolist())

    try:
        with contextlib.redirect_stdout(output_buffer):
            exec(code, {}, local_vars)

        if plt.get_fignums():
            plot_path = "data/plot.png"
            plt.savefig(plot_path)
            plt.close()

        result = local_vars.get("result", output_buffer.getvalue())
        summary = local_vars.get("summary", "No summary provided.")
        return result, summary

    except Exception as e:
        print("❌ Code execution error:", e)  # Logs error to terminal
        return "Error occurred during code execution.", str(e)
