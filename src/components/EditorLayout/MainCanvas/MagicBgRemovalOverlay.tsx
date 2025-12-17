import React from 'react'

interface MagicBgRemovalOverlayProps {
  isActive: boolean
  isCompleting: boolean
  bgColor: string
}

const MagicBgRemovalOverlay: React.FC<MagicBgRemovalOverlayProps> = ({ isActive, isCompleting, bgColor }) => {
  if (!isActive) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1001 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: bgColor,
          opacity: 0.7,
          transform: isCompleting ? 'translateX(100%)' : 'translateX(0%)',
          transition: 'transform 3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />

      {!isCompleting && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 50%, rgba(34,211,238,0.15) 100%)',
            animationDuration: '1s'
          }}
        />
      )}

      {!isCompleting && <div className="h-4 w-4 border-2 border-gray-400 border-t-black rounded-full animate-spin absolute bottom-2 left-2" />}
    </div>
  )
}

export default MagicBgRemovalOverlay
