import subprocess
import sys

# Use shell=True to let the shell find npx in the PATH
proc = subprocess.Popen(
    ['npx', 'shadcn@latest', 'init'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    shell=True
)
# Send two Enter keys (for component library and preset)
stdout, stderr = proc.communicate(input='\n\n')
print('stdout:', stdout)
print('stderr:', stderr)
print('return code:', proc.returncode)
