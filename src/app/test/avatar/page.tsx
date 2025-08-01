'use client'

import { useState } from 'react'
import { generateRandomAvatar, generateAvatarFromName, generateAvatarFromEmail } from '@/utils/avatarGenerator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AvatarTestPage() {
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')
  const [randomAvatar, setRandomAvatar] = useState(generateRandomAvatar())
  const [nameAvatar, setNameAvatar] = useState(generateAvatarFromName(name))
  const [emailAvatar, setEmailAvatar] = useState(generateAvatarFromEmail(email))

  const handleGenerateRandom = () => {
    setRandomAvatar(generateRandomAvatar())
  }

  const handleGenerateFromName = () => {
    setNameAvatar(generateAvatarFromName(name))
  }

  const handleGenerateFromEmail = () => {
    setEmailAvatar(generateAvatarFromEmail(email))
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">DiceBear Avatar Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Random Avatar */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Random Avatar</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
                <img
                  src={randomAvatar}
                  alt="Random Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button onClick={handleGenerateRandom} variant="outline">
                Generate New Random
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                URL: {randomAvatar}
              </p>
            </div>
          </div>

          {/* Name-based Avatar */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Name-based Avatar</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
                  <img
                    src={nameAvatar}
                    alt="Name Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button onClick={handleGenerateFromName} variant="outline">
                  Generate from Name
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  URL: {nameAvatar}
                </p>
              </div>
            </div>
          </div>

          {/* Email-based Avatar */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email-based Avatar</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-border">
                  <img
                    src={emailAvatar}
                    alt="Email Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button onClick={handleGenerateFromEmail} variant="outline">
                  Generate from Email
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  URL: {emailAvatar}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-4">How it works</h3>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Random Avatar:</strong> Generates a completely random avatar each time</li>
            <li>• <strong>Name-based Avatar:</strong> Same name always generates the same avatar (deterministic)</li>
            <li>• <strong>Email-based Avatar:</strong> Same email always generates the same avatar (deterministic)</li>
            <li>• Uses DiceBear's Pixel Art style API: <code>https://api.dicebear.com/9.x/pixel-art/svg</code></li>
            <li>• Avatars are generated on-demand and cached by the browser</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 