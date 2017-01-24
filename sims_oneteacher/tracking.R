#### Tracking simulations

rm(list=ls())
source("helper.R")

## parameters
n.students.total <- c(12, 24, 48, 96)
n.classes <- c(1,2,3,4)

n.sims <- 2000
teacher.mu <- .75
teacher.nu <- 10

student.mu.params <- c(1,1) # for a beta distribution, uninformative
student.nu.params <- c(1,2) # for a gamma distribution, shape, scale

## simulation code
d <- data.frame()

start <- Sys.time()
for (n in n.students.total) {
  for (cs in n.classes) {
    
    ## untracked simulations    
    igs.untracked <- sapply(1:n.sims, function (x) {
      # students per class
      class.size <- n/cs
      
      # for each class
      ig.max.c <- array(dim=cs)
      for (i in 1:cs) {
        # generate students for each class
        student.mus <- rbeta(class.size, student.mu.params[1], student.mu.params[2])
        student.nus <- rgamma(class.size, shape=student.nu.params[1],
                              scale=student.nu.params[2])
        
        # get info gain for best strategy
        ig.max.c[i] <- maximize.ig(student.mus, student.nus, teacher.mu, teacher.nu)
      }
      
      ig.max <- mean(ig.max.c)
      
      return(ig.max)
    })
    
    d <- rbind(d,data.frame(n=n,
                            n.classes=cs,
                            class.size=n/cs,
                            tracking="Untracked Classes",
                            ig=igs.untracked))
    
    ## tracked simulations    
    igs.tracked <- sapply(1:n.sims, function (x) {
      ## generate students first
      student.mus <- rbeta(n, student.mu.params[1], student.mu.params[2])
      student.nus <- rgamma(n, shape=student.nu.params[1],
                            scale=student.nu.params[2])
      
      ## now sort the students by bias
      sorted <- sort(student.mus, index.return=TRUE)      
      student.mus <- sorted$x
      student.nus <- student.nus[sorted$ix]
      
      class.size <- n/cs # students per class
      
      # for each class
      ig.max.c <- array(dim=cs)
      for (i in 1:cs) {
        # get students for each class
        student.mus.c <- student.mus[(1 + (i-1)*class.size) : (i*class.size)]
        student.nus.c <- student.nus[(1 + (i-1)*class.size) : (i*class.size)]
        
        # get info gain for best strategy
        ig.max.c[i] <- maximize.ig(student.mus.c, student.nus.c, teacher.mu, teacher.nu)
      }
      
      ig.max <- mean(ig.max.c)
      
      return(ig.max)
    })
    
    d <- rbind(d,data.frame(n=n,
                            n.classes=cs,
                            class.size=n/cs,
                            tracking="Tracked Classes",
                            ig=igs.tracked))
  }
}
Sys.time() - start


ms <- aggregate(ig ~ n.classes + class.size + tracking, d, mean)
ms$cil <- aggregate(ig ~ n.classes + class.size + tracking, d, ci.low)$ig
ms$cih <- aggregate(ig ~ n.classes + class.size + tracking, d, ci.high)$ig

ms$n.classes <- factor(ms$n.classes)

## plot
quartz()
qplot(class.size,ig,colour=n.classes,group=n.classes,
      label=n.classes,
      ymin=ig-cil,ymax=ig+cih,
      facets=.~tracking,
      geom=c("line","linerange"),
      data=ms) +
  xlab("Class Size") + 
  ylab("Average information gain (nats)") + 
  scale_colour_discrete(name="Classes") + 
  scale_x_continuous(breaks=c(3,6,12,24,48,96)) 

