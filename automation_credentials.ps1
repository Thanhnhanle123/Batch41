$credentialInteropSource = @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

public static class Batch41CredentialStore
{
    private const int GenericCredential = 1;
    private const int LocalMachinePersistence = 2;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct NativeCredential
    {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("Advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredWrite(ref NativeCredential credential, int flags);

    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredRead(string target, int type, int flags, out IntPtr credential);

    [DllImport("Advapi32.dll", EntryPoint = "CredFree")]
    private static extern void CredFree(IntPtr buffer);

    public static void Save(string target, string userName, string password)
    {
        byte[] secret = Encoding.Unicode.GetBytes(password + "\0");
        IntPtr blob = Marshal.AllocHGlobal(secret.Length);
        try
        {
            Marshal.Copy(secret, 0, blob, secret.Length);
            NativeCredential credential = new NativeCredential
            {
                Type = GenericCredential,
                TargetName = target,
                UserName = userName,
                CredentialBlobSize = secret.Length,
                CredentialBlob = blob,
                Persist = LocalMachinePersistence
            };
            if (!CredWrite(ref credential, 0))
                throw new Win32Exception(Marshal.GetLastWin32Error());
        }
        finally
        {
            Marshal.Copy(new byte[secret.Length], 0, blob, secret.Length);
            Marshal.FreeHGlobal(blob);
            Array.Clear(secret, 0, secret.Length);
        }
    }

    public static string[] Load(string target)
    {
        IntPtr credentialPointer;
        if (!CredRead(target, GenericCredential, 0, out credentialPointer))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "Credential not found: " + target);
        try
        {
            NativeCredential credential =
                (NativeCredential)Marshal.PtrToStructure(credentialPointer, typeof(NativeCredential));
            byte[] secret = new byte[credential.CredentialBlobSize];
            Marshal.Copy(credential.CredentialBlob, secret, 0, secret.Length);
            try
            {
                return new string[] {
                    credential.UserName,
                    Encoding.Unicode.GetString(secret).TrimEnd('\0')
                };
            }
            finally
            {
                Array.Clear(secret, 0, secret.Length);
            }
        }
        finally
        {
            CredFree(credentialPointer);
        }
    }
}
'@

if (-not ("Batch41CredentialStore" -as [type])) {
  Add-Type -TypeDefinition $credentialInteropSource -Language CSharp
}
