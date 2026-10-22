# Gera os ícones do app (gota com broto) nos tamanhos que o Expo usa.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/gerar-icones.ps1
Add-Type -AssemblyName System.Drawing

$destino = Join-Path $PSScriptRoot '..\assets\images'
$verde = [System.Drawing.ColorTranslator]::FromHtml('#1F6B2E')
$branco = [System.Drawing.Color]::White

function Desenhar-Gota($g, [double]$escala, [double]$dx, [double]$dy, $corGota, $corBroto) {
  # Gota: círculo embaixo + triângulo tangente com a ponta para cima (coordenadas numa tela de 1024).
  $cx = 512.0; $cy = 610.0; $r = 260.0; $topo = 150.0
  $d = $cy - $topo
  $alfa = [Math]::Asin($r / $d)
  $tx = $r * [Math]::Cos($alfa); $ty = $cy - $r * [Math]::Sin($alfa)
  $p = { param($x, $y) New-Object System.Drawing.PointF ([float]($x * $escala + $dx)), ([float]($y * $escala + $dy)) }

  $pincel = New-Object System.Drawing.SolidBrush $corGota
  $g.FillPolygon($pincel, [System.Drawing.PointF[]]@((& $p $cx $topo), (& $p ($cx - $tx) $ty), (& $p ($cx + $tx) $ty)))
  $g.FillEllipse($pincel, [float](($cx - $r) * $escala + $dx), [float](($cy - $r) * $escala + $dy), [float](2 * $r * $escala), [float](2 * $r * $escala))

  if ($corBroto) {
    $caneta = New-Object System.Drawing.Pen $corBroto, ([float](34 * $escala))
    $caneta.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $caneta.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($caneta, (& $p 512 770), (& $p 512 560))
    $folha = New-Object System.Drawing.SolidBrush $corBroto
    # Folhas presas ao topo do caule, abrindo para cima (rotação positiva = sentido horário).
    foreach ($f in @(@(428, 522, 28), @(596, 508, -28))) {
      $estado = $g.Save()
      $centro = & $p $f[0] $f[1]
      $g.TranslateTransform($centro.X, $centro.Y)
      $g.RotateTransform([float]$f[2])
      $g.FillEllipse($folha, [float](-95 * $escala), [float](-42 * $escala), [float](190 * $escala), [float](84 * $escala))
      $g.Restore($estado)
    }
  }
}

function Salvar([int]$tamanho, [string]$nome, $fundo, [double]$ocupacao, $corGota, $corBroto) {
  $bmp = New-Object System.Drawing.Bitmap $tamanho, $tamanho, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear($(if ($fundo) { $fundo } else { [System.Drawing.Color]::Transparent }))
  # A gota ocupa ~620x620 da tela de 1024; centraliza com a ocupação pedida.
  $escala = ($tamanho * $ocupacao) / 640.0
  $dx = ($tamanho - 1024 * $escala) / 2.0
  $dy = ($tamanho - 1024 * $escala) / 2.0 + 15 * $escala
  Desenhar-Gota $g $escala $dx $dy $corGota $corBroto
  $g.Dispose()
  $bmp.Save((Join-Path $destino $nome), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  "gerado: $nome ($tamanho px)"
}

Salvar 1024 'icon.png' $verde 0.62 $branco $verde                       # loja e iPhone (sem transparência)
Salvar 1024 'android-icon-foreground.png' $null 0.42 $branco $verde     # dentro da área segura do ícone adaptável
Salvar 1024 'android-icon-background.png' $verde 0 $verde $null         # fundo liso
Salvar 1024 'android-icon-monochrome.png' $null 0.42 $branco $null      # ícone temático do Android 13+
Salvar 512 'splash-icon.png' $null 0.9 $branco $verde                    # tela de abertura (fundo verde no app.json)
Salvar 48 'favicon.png' $verde 0.7 $branco $verde
