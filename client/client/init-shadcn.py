import subprocess
import sys

# Use the full path to npx
npx_path = r'/c/Program Files/nodejs/npx'
# Alternatively, we can use 'npx' and let the shell find it, but we'll use the full path
# We'll use shell=True to let the shell handle the command
proc = subprocess.Popen(
    ['npx', 'shadcn@latest', 'init'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    shell=True  # This is important for Windows to find npx in the PATH
)
# Send the Enter key
stdout, stderr = proc.communicate(input='\n')
print('stdout:', stdout)
print('stderr:', stderr)
print('return code:', proc.returncode)